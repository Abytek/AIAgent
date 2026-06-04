
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");

function createAgentLLMContext(agent)
{
    const agentContext = makeEventEmitter({
        agent,
        messages: [],
    });
    return agentContext;
}

module.exports = {
    createAgentLLMContext
};