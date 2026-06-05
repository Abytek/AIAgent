
const chalk = require("chalk");
const { io } = require("socket.io-client");
const { makeEventEmitter } = require("../utilities/eventEmitter");

function createAgentTracking(agent, ownerName, url)
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
                    agent.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], `Connecting to ${ownerName} at:`, url);

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

                    agentTracking.io = io(url, {
                        reconnection: false
                    });
                    
                    agentTracking.io.on("connect", async () => {
                        await agentTracking.io.emit(
                            "registerAgent", 
                            { 
                                id: agent.id,
                                url: agentServer.url
                            },
                            (res) => {
                                if (res.status == 200)
                                {
                                    agentTracking.enabled = true;
                                    agent.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], `Connected to ${ownerName}`);
                                    sync();
                                }
                                else
                                {
                                    throw new Error(`Failed to connect to ${ownerName}${ownerName}: ${res.message}`);
                                    process.exit(1);
                                    sync();
                                }
                            }
                        );
                    });
            
                    agentTracking.io.on("connect_error", (err) => {
                        agent.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], `Connect to ${ownerName} failed`);
                        process.exit(1);
                        sync();
                    });
            
                    agentTracking.io.on("disconnect", (reason) => {
                        agent.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], `Disconnected from ${ownerName}:`, reason);
                        process.exit(1);
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