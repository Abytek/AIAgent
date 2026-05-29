
function createAgentLogger(agent)
{
    let agentLogger = {};

    agentLogger.agent = agent;

    agentLogger.log = function(...args)
    {
        console.log(`[${agent.id}] [${agent.path}]`, ...args, "\n");
    }

    return agentLogger;
}

module.exports = {
    createAgentLogger
};