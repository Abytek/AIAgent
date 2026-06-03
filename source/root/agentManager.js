
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { finalizeRootAgentInfo } = require("./agent");

function createRootAgentManager(root)
{
    const rootServer = root.subsystems.server;

    const rootAgentManager = makeEventEmitter({
        root,
        agentInfos: new Map(), // key: agent id, value: agent info
        socketToAgentId: new Map(), // key: socket IO, value: agent id
    })
    rootAgentManager.hasAgentInfo = function(agentId) {
        return rootAgentManager.agentInfos.has(agentId);
    }
    rootAgentManager.findAgentInfo = function(agentId) {
        if (!rootAgentManager.hasAgentInfo(agentId))
        {
            return null;
        }
        return rootAgentManager.agentInfos.get(agentId);
    }
    rootAgentManager.getAgentInfo = function(agentId) {
        if (!rootAgentManager.hasAgentInfo(agentId))
        {
            throw new Error(`Not found agent: ${agentId}`);
        }
        return rootAgentManager.agentInfos.get(agentId);
    }
    let nextAgentIndex = 0;
    rootAgentManager.generateAgentId = function()
    {
        let agentIndex = nextAgentIndex;
        ++nextAgentIndex;
        return `${root.id.replaceAll("Root", "Agent")}.${agentIndex}`;
    }

    // root agent manager events
    rootAgentManager.on(
        "registerAgent",
        async (socket, agentInfo) => {
            root.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `Registered agent:`, agentInfo);
            rootAgentManager.agentInfos.set(
                agentInfo.id, 
                agentInfo
            );
        }
    );
    rootAgentManager.on(
        "unregisterAgent",
        async (socket, agentInfo) => {
            rootAgentManager.agentInfos.delete(agentInfo.id);
            root.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `Unregistered agent:`, chalk.rgb(200, 70, 150)(agentInfo.id));
        }
    );

    // 
    async function registerAgent(socket, agentInfo)
    {
        await rootAgentManager.emit("registerAgent", socket, agentInfo);
    }
    async function unregisterAgent(socket, agentInfo)
    {
        await rootAgentManager.emitReversed("unregisterAgent", socket, agentInfo);
    }

    // root server events
    rootServer.on(
        "setup",
        async () => {
            rootServer.app.get("/agentInfos", (req, res) => {
                let agentInfos = [];
                rootAgentManager.agentInfos.forEach(
                    value => {
                        agentInfos.push(value);
                    }
                );
                res.status(200).json(agentInfos);
            });

            let nextAgentIndex = 0;
            rootServer.app.get("/generateAgentId", (req, res) => {
                res.status(200).send(rootAgentManager.generateAgentId());
            });
        }
    );
    rootServer.on(
        "socketClient_connected",
        async (socket) => {
            socket.on(
                "registerAgent",
                async (agentInfo, ack) => {
                    try 
                    {
                        agentInfo = finalizeRootAgentInfo(agentInfo);
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
                    if (!rootAgentManager.agentInfos.has(agentId))
                    {
                        if (ack)
                        {
                            return ack({ status: 400, message: `Not found agent to unregister: ${agentId}` });
                        }
                    }

                    const agentInfo = rootAgentManager.agentInfos.get(agentId);

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
    rootServer.on(
        "socketClient_disconnected",
        async (socket, reason) => {
            if (!rootAgentManager.socketToAgentId.has(socket))
            {
                return;
            }

            const agentId = rootAgentManager.socketToAgentId.get(socket);
            const agentInfo = rootAgentManager.agentInfos.get(agentId);
            await unregisterAgent(socket, agentInfo);
        }
    );

    // root events
    root.on(
        "init",
        async () => {
        }
    );
    root.on(
        "release",
        async () => {
            {
                let agentURLs = [];
                rootAgentManager.agentInfos.forEach(
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
    return rootAgentManager;
}

module.exports = {
    createRootAgentManager
}