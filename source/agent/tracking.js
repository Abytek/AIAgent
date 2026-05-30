
const { io } = require("socket.io-client");
const { makeSync } = require("../utilities/sync");

function createAgentTracking(agent)
{
    let agentTracking = {};

    agentTracking.agent = agent;
    agentTracking.enabled = false;

    {
        let sync = makeSync();
        agent.logger.log([], `Connecting to root manager at:`, agent.config.rootManager.url);
        agentTracking.socket = io(agent.config.rootManager.url, {
            reconnection: false
        });

        agentTracking.socket.on("agent_messages", (messages, ack) => {
            for (const message of messages)
            {
                agent.message(message);
            }
            if (ack)
            {
                ack({ status: 200, message: `Got the message` });
                return;
            }
        });

        agentTracking.socket.on("connect", () => {
            agentTracking.socket.emit(
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
                        agent.logger.log([], "Connected to root manager");
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
            agent.logger.log([], "Connect to root manager failed");
            sync.stop();
        });

        agentTracking.socket.on("disconnect", (reason) => {
            agent.logger.log([], "Disconnected from root manager:", reason);
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