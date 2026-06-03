
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { finalizeRuntimeAgentInfo } = require("./agent");

function createRuntimeAgentManager(runtime)
{
    const runtimeServer = runtime.subsystems.server;

    const runtimeAgentManager = makeEventEmitter({
        runtime,
        agentinfos: new Map(), // key: agent id, value: agent info
        socketToAgentId: new Map(), // key: socket IO, value: agent id
    })
    runtimeAgentManager.hasAgentInfo = function(agentId) {
        return runtimeAgentManager.agentinfos.has(agentId);
    }
    runtimeAgentManager.findAgentInfo = function(agentId) {
        if (!runtimeAgentManager.hasAgentInfo(agentId))
        {
            return null;
        }
        return runtimeAgentManager.agentinfos.get(agentId);
    }
    runtimeAgentManager.getAgentInfo = function(agentId) {
        if (!runtimeAgentManager.hasAgentInfo(agentId))
        {
            throw new Error(`Not found agent: ${agentId}`);
        }
        return runtimeAgentManager.agentinfos.get(agentId);
    }
    let nextAgentIndex = 0;
    runtimeAgentManager.generateAgentId = function()
    {
        let agentIndex = nextAgentIndex;
        ++nextAgentIndex;
        return `${runtime.id.replaceAll("Runtime", "Agent")}.${agentIndex}`;
    }

    // runtime agent manager events
    runtimeAgentManager.on(
        "registerAgent",
        async (socket, agentInfo) => {
            runtime.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `Registered agent:`, agentInfo);
            runtimeAgentManager.agentinfos.set(
                agentInfo.id, 
                agentInfo
            );
        }
    );
    runtimeAgentManager.on(
        "unregisterAgent",
        async (socket, agentInfo) => {
            runtimeAgentManager.agentinfos.delete(agentInfo.id);
            runtime.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `Unregistered agent:`, chalk.rgb(200, 70, 150)(agentInfo.id));
        }
    );

    // 
    async function registerAgent(socket, agentInfo)
    {
        await runtimeAgentManager.emit("registerAgent", socket, agentInfo);
    }
    async function unregisterAgent(socket, agentInfo)
    {
        await runtimeAgentManager.emitReversed("unregisterAgent", socket, agentInfo);
    }

    // runtime server events
    runtimeServer.on(
        "setup",
        async () => {
            runtimeServer.app.get("/agentInfos", (req, res) => {
                let agentInfos = [];
                runtimeAgentManager.agentinfos.forEach(
                    value => {
                        agentInfos.push(value);
                    }
                );
                res.status(200).json(agentInfos);
            });

            let nextAgentIndex = 0;
            runtimeServer.app.get("/generateAgentId", (req, res) => {
                res.status(200).send(runtimeAgentManager.generateAgentId());
            });
        }
    );
    runtimeServer.on(
        "socketClient_connected",
        async (socket) => {
            socket.on(
                "registerAgent",
                async (agentInfo, ack) => {
                    try 
                    {
                        agentInfo = finalizeRuntimeAgentInfo(agentInfo);
                        await registerAgent(socket, agentInfo);
                    }
                    catch(err)
                    {
                        if (ack)
                        {
                            return ack({ status: 400, message: err.message });
                        }
                    }
                    if (ack)
                    {
                        return ack({ status: 200, message: `Registered agent` });
                    }
                }
            );
            socket.on(
                "unregisterAgent",
                async (agentId, ack) => {
                    if (!runtimeAgentManager.agentinfos.has(agentId))
                    {
                        if (ack)
                        {
                            return ack({ status: 400, message: `Not found agent to unregister: ${agentId}` });
                        }
                    }

                    const agentInfo = runtimeAgentManager.agentinfos.get(agentId);

                    try 
                    {
                        await unregisterAgent(socket, agentInfo);
                    }
                    catch(err)
                    {
                        if (ack)
                        {
                            return ack({ status: 400, message: err.message });
                        }
                    }
                    if (ack)
                    {
                        return ack({ status: 200, message: `Unregistered agent ${agentId}` });
                    }
                }
            );
        }
    );
    runtimeServer.on(
        "socketClient_disconnected",
        async (socket, reason) => {
            if (!runtimeAgentManager.socketToAgentId.has(socket))
            {
                return;
            }

            const agentId = runtimeAgentManager.socketToAgentId.get(socket);
            const agentInfo = runtimeAgentManager.agentinfos.get(agentId);
            await unregisterAgent(socket, agentInfo);
        }
    );

    // runtime events
    runtime.on(
        "init",
        async () => {
        }
    );
    runtime.on(
        "release",
        async () => {
            {
                let agentURLs = [];
                runtimeAgentManager.agentinfos.forEach(
                    value => {
                        agentURLs.push(value.url);
                    }
                )
                for (const agentURL of agentURLs)
                {
                    try
                    {
                        await fetch(`${agentURL}/stop`, {
                            method: "POST"
                        });
                    }
                    catch(err)
                    {
                    }
                }
            }
        }
    );
    return runtimeAgentManager;
}

module.exports = {
    createRuntimeAgentManager
}