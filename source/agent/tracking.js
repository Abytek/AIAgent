
const chalk = require("chalk");
const { io } = require("socket.io-client");
const { makeEventEmitter } = require("../utilities/eventEmitter");

function createAgentTracking(agent)
{
    const agentServer = agent.subsystems.server;

    const agentTracking = makeEventEmitter({
        agent,
        enabled: false,
    });

    // agent events
    agent.on(
        "init",
        async () => {
            await new Promise(
                (resolve) => {
                    agent.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], `Connecting to root at:`, agent.config.root.url);

                    let synchronized = false;
                    function sync()
                    {
                        if (synchronized)
                        {
                            return;
                        }
                        synchronized = true;
                        resolve();
                    }

                    agentTracking.io = io(agent.config.root.url, {
                        reconnection: false
                    });
                    
                    agentTracking.io.on("connect", async () => {
                        await agentTracking.io.emit(
                            "registerAgent", 
                            { 
                                id: agent.id,
                                brief: agent.brief,
                                tags: agent.tags,
                                url: agentServer.url
                            },
                            (res) => {
                                if (res.status == 200)
                                {
                                    agentTracking.enabled = true;
                                    agent.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], "Connected to root");
                                    sync();
                                }
                                else
                                {
                                    throw new Error(`Failed to connect to root: ${res.message}`);
                                    sync();
                                }
                            }
                        );
                    });
            
                    agentTracking.io.on("connect_error", (err) => {
                        agent.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], "Connect to root failed");
                        sync();
                    });
            
                    agentTracking.io.on("disconnect", (reason) => {
                        agent.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], "Disconnected from root:", reason);
                        sync();
                    });
                }
            )
        }
    );
    agent.on(
        "release",
        async () => {
            agentTracking.io.close();
        }
    );
    return agentTracking;
}

module.exports = {
    createAgentTracking
}