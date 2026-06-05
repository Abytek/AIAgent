
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { finalizeAgentTrackingData } = require("./agentTrackingData");

function createAgentTracker(options)
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

    const agentTracker = makeEventEmitter({
        gameLoop,
        agentTrackingDatas: new Map(), // key: agent id, value: agent info
        socketToAgentId: new Map(), // key: socket IO, value: agent id
    })
    agentTracker.hasAgentTrackingData = function(agentId) {
        return agentTracker.agentTrackingDatas.has(agentId);
    }
    agentTracker.findAgentTrackingData = function(agentId) {
        if (!agentTracker.hasAgentTrackingData(agentId))
        {
            return null;
        }
        return agentTracker.agentTrackingDatas.get(agentId);
    }
    agentTracker.getAgentTrackingData = function(agentId) {
        if (!agentTracker.hasAgentTrackingData(agentId))
        {
            throw new Error(`Not found agent: ${agentId}`);
        }
        return agentTracker.agentTrackingDatas.get(agentId);
    }

    if (parentId)
    {
        let nextAgentIndex = 0;
        agentTracker.generateAgentId = function()
        {
            let agentIndex = nextAgentIndex;
            ++nextAgentIndex;
            const right = parentId.slice(parentId.lastIndexOf("@") + 1);
            return `AIAgent@${right}.${agentIndex}`;
        }
    }

    // root agent manager events
    agentTracker.on(
        "registerAgent",
        async (socket, agentTrackingData) => {
            gameLoop.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `Registered agent:`, agentTrackingData);
            agentTracker.agentTrackingDatas.set(
                agentTrackingData.id, 
                agentTrackingData
            );
            agentTracker.socketToAgentId.set(
                socket,
                agentTrackingData.id
            );
        }
    );
    agentTracker.on(
        "unregisterAgent",
        async (socket, agentTrackingData) => {
            gameLoop.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `Unregistered agent:`, chalk.rgb(200, 70, 150)(agentTrackingData.id));
            agentTracker.socketToAgentId.delete(agentTrackingData.id);
            agentTracker.agentTrackingDatas.delete(agentTrackingData.id);
        }
    );

    // 
    async function registerAgent(socket, agentTrackingData)
    {
        await agentTracker.emit("registerAgent", socket, agentTrackingData);
    }
    async function unregisterAgent(socket, agentTrackingData)
    {
        await agentTracker.emitReversed("unregisterAgent", socket, agentTrackingData);
    }

    // root server events
    gameLoopServer.on(
        "setup",
        async () => {
            gameLoopServer.app.get("/agentTrackingDatas", (req, res) => {
                let agentTrackingDatas = [];
                agentTracker.agentTrackingDatas.forEach(
                    value => {
                        agentTrackingDatas.push(value);
                    }
                );
                res.status(200).json(agentTrackingDatas);
            });

            if (parentId)
            {
                gameLoopServer.app.get("/generateAgentId", (req, res) => {
                    res.status(200).send(agentTracker.generateAgentId());
                });
            }
        }
    );
    gameLoopServer.on(
        "socketClient_connected",
        async (socket) => {
            socket.on(
                "registerAgent",
                async (agentTrackingData, ack) => {
                    try 
                    {
                        agentTrackingData = finalizeAgentTrackingData(agentTrackingData);
                        await registerAgent(socket, agentTrackingData);
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
                    if (!agentTracker.agentTrackingDatas.has(agentId))
                    {
                        if (ack)
                        {
                            return ack({ status: 400, message: `Not found agent to unregister: ${agentId}` });
                        }
                    }

                    const agentTrackingData = agentTracker.agentTrackingDatas.get(agentId);

                    try 
                    {
                        await unregisterAgent(socket, agentTrackingData);
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
            if (!agentTracker.socketToAgentId.has(socket))
            {
                return;
            }

            const agentId = agentTracker.socketToAgentId.get(socket);
            const agentTrackingData = agentTracker.agentTrackingDatas.get(agentId);
            await unregisterAgent(socket, agentTrackingData);
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
                agentTracker.agentTrackingDatas.forEach(
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
    return agentTracker;
}

module.exports = {
    createAgentTracker
}