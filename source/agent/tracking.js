
const { io } = require("socket.io-client");
const { makeSync } = require("../utilities/sync");
const chalk = require("chalk");

function createAgentTracking(agent)
{
    let agentTracking = {};
    agent.closeCommands.push(() => agentTracking.close());

    agentTracking.agent = agent;
    agentTracking.enabled = false;

    {
        let sync = makeSync();
        agent.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], `Connecting to root manager at:`, agent.config.rootManager.url);
        agentTracking.socket = io(agent.config.rootManager.url, {
            reconnection: false
        });

        agentTracking.socket.on("connect", async () => {
            await agentTracking.socket.emit(
                "register", 
                { 
                    id: agent.id,
                    path: agent.path,
                    config: agent.config,
                    brief: agent.brief,
                    url: agent.server.url
                },
                (res) => {
                    if (res.status == 200)
                    {
                        agentTracking.enabled = true;
                        agent.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], "Connected to root manager");
                        sync.stop();
                    }
                    else
                    {
                        throw new Error(`Failed to connect to root manager: ${res.message}`);
                        sync.stop();
                    }
                }
            );
        });

        agentTracking.socket.on("connect_error", (err) => {
            agent.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], "Connect to root manager failed");
            sync.stop();
        });

        agentTracking.socket.on("disconnect", (reason) => {
            agent.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], "Disconnected from root manager:", reason);
            sync.stop();
        });
        sync.wait();
    }

    agentTracking.close = function()
    {
        if (!agentTracking.enabled)
        {
            return;
        }
        agentTracking.socket.close();
    }

    return agentTracking;
}

module.exports = {
    createAgentTracking
};