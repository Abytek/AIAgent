
function createAgentContext(agent)
{
    let agentContext = {};
    agentContext.agent = agent;
    agentContext.messages = [];
    return agentContext;
}

module.exports = {
    createAgentContext
};