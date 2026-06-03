
const { createAgentServer } = require("./server");
const { createAgentServiceRegistry } = require("./serviceRegistry");
const { createAgentTracking } = require("./tracking");

function createAgentSubsystems(agent)
{
    agent.subsystems = {};
    agent.subsystems.server = createAgentServer(agent);
    agent.subsystems.serviceRegistry = createAgentServiceRegistry(agent);
    agent.subsystems.runtimeTracking = createAgentTracking(
        agent,
        "runtime",
        agent.config.runtime.url
    );
    agent.subsystems.rootTracking = createAgentTracking(
        agent,
        "root",
        agent.config.root.url
    );
}

module.exports = {
    createAgentSubsystems
}