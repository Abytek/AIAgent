
const { createAgentServer } = require("./server");
const { createAgentServiceRegistry } = require("./serviceRegistry");
const { createAgentTracking } = require("./tracking");

function createAgentSubsystems(agent)
{
    agent.subsystems = {};
    agent.subsystems.server = createAgentServer(agent);
    agent.subsystems.serviceRegistry = createAgentServiceRegistry(agent);
    agent.subsystems.tracking = createAgentTracking(agent);
}

module.exports = {
    createAgentSubsystems
}