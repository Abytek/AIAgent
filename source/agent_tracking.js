
const { io } = require("socket.io-client");
const deasync = require("deasync");

function createAgentTracking(agent)
{
    let agentTracking = {};

    agentTracking.agent = agent;
    agentTracking.enabled = false;

    {
        let isDone = false;
        console.log(`Connecting to root manager at:`, agent.config.rootManager.url);
        agentTracking.socket = io(agent.config.rootManager.url, {
            reconnection: false
        });

        agentTracking.socket.on("connect", () => {
            agentTracking.socket.emit(
                "register", 
                { 
                    id: agent.id,
                    url: "dummy"
                },
                (res) => {
                    if (res.status == 200)
                    {
                        agentTracking.enabled = true;
                        console.log("Connected to root manager");
                        isDone = true;
                    }
                    else
                    {
                        console.log("Connect to root manager failed:", res);
                        isDone = true;
                    }
                }
            );
        });

        agentTracking.socket.on("connect_error", (err) => {
            console.log("Connect to root manager failed");
            isDone = true;
        });

        agentTracking.socket.on("disconnect", (reason) => {
            console.log("Disconnected from root manager:", reason);
            isDone = true;
        });
        deasync.loopWhile(() => !isDone);
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