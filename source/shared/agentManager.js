
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { finalizeAgentInfo } = require("./agent");

function createAgentManager(options)
{
    options = options || {};

    if (!("gameLoop" in options))
    {
        throw new Error(`Requires "gameLoop" in options`);
    }
    const gameLoop = options.gameLoop;

    if (!("gameLoopServer" in options))
    {
        throw new Error(`Requires "gameLoopServer" in options`);
    }
    const gameLoopServer = options.gameLoopServer;

    const parentId = options.parentId;

    const agentManager = makeEventEmitter({
        gameLoop,
        agentInfos: new Map(), // key: agent id, value: agent info
        socketToAgentId: new Map(), // key: socket IO, value: agent id
    })
    agentManager.hasAgentInfo = function(agentId) {
        return agentManager.agentInfos.has(agentId);
    }
    agentManager.findAgentInfo = function(agentId) {
        if (!agentManager.hasAgentInfo(agentId))
        {
            return null;
        }
        return agentManager.agentInfos.get(agentId);
    }
    agentManager.getAgentInfo = function(agentId) {
        if (!agentManager.hasAgentInfo(agentId))
        {
            throw new Error(`Not found agent: ${agentId}`);
        }
        return agentManager.agentInfos.get(agentId);
    }

    if (parentId)
    {
        let nextAgentIndex = 0;
        agentManager.generateAgentId = function()
        {
            let agentIndex = nextAgentIndex;
            ++nextAgentIndex;
            const right = parentId.slice(parentId.lastIndexOf("@") + 1);
            return `AIAgent@${right}.${agentIndex}`;
        }
    }

    // root agent manager events
    agentManager.on(
        "registerAgent",
        async (socket, agentInfo) => {
            gameLoop.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `Registered agent:`, agentInfo);
            agentManager.agentInfos.set(
                agentInfo.id, 
                agentInfo
            );
        }
    );
    agentManager.on(
        "unregisterAgent",
        async (socket, agentInfo) => {
            agentManager.agentInfos.delete(agentInfo.id);
            gameLoop.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `Unregistered agent:`, chalk.rgb(200, 70, 150)(agentInfo.id));
        }
    );

    // 
    async function registerAgent(socket, agentInfo)
    {
        await agentManager.emit("registerAgent", socket, agentInfo);
    }
    async function unregisterAgent(socket, agentInfo)
    {
        await agentManager.emitReversed("unregisterAgent", socket, agentInfo);
    }

    // root server events
    gameLoopServer.on(
        "setup",
        async () => {
            gameLoopServer.app.get("/agentInfos", (req, res) => {
                let agentInfos = [];
                agentManager.agentInfos.forEach(
                    value => {
                        agentInfos.push(value);
                    }
                );
                res.status(200).json(agentInfos);
            });

            if (parentId)
            {
                gameLoopServer.app.get("/generateAgentId", (req, res) => {
                    res.status(200).send(agentManager.generateAgentId());
                });
            }
        }
    );
    gameLoopServer.on(
        "socketClient_connected",
        async (socket) => {
            socket.on(
                "registerAgent",
                async (agentInfo, ack) => {
                    try 
                    {
                        agentInfo = finalizeAgentInfo(agentInfo);
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
                    if (!agentManager.agentInfos.has(agentId))
                    {
                        if (ack)
                        {
                            return ack({ status: 400, message: `Not found agent to unregister: ${agentId}` });
                        }
                    }

                    const agentInfo = agentManager.agentInfos.get(agentId);

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
    gameLoopServer.on(
        "socketClient_disconnected",
        async (socket, reason) => {
            if (!agentManager.socketToAgentId.has(socket))
            {
                return;
            }

            const agentId = agentManager.socketToAgentId.get(socket);
            const agentInfo = agentManager.agentInfos.get(agentId);
            await unregisterAgent(socket, agentInfo);
        }
    );

    // root events
    gameLoop.on(
        "init",
        async () => {
        }
    );
    gameLoop.on(
        "release",
        async () => {
            {
                let agentURLs = [];
                agentManager.agentInfos.forEach(
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
    return agentManager;
}

module.exports = {
    createAgentManager
}