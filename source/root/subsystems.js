
const { createRootServer } = require("./server");
const { createRootRuntimeTracker } = require("./runtimeTracker");
const { createRootAgentRegistry } = require("./agentRegistry");
const { createRootAgentTracker } = require("./agentTracker");
const { createRootAgentSpawnerManager } = require("./agentSpawnerManager");
const { createRootAgentCommunicationManager } = require("./agentCommunicationManager");

function createRootSubsystems(root)
{
    root.subsystems = {};
    root.subsystems.server = createRootServer(root);
    root.subsystems.runtimeTracker = createRootRuntimeTracker(root);
    root.subsystems.agentRegistry = createRootAgentRegistry(root);
    root.subsystems.agentTracker = createRootAgentTracker(root);
    root.subsystems.agentSpawnerManager = createRootAgentSpawnerManager(root);
    root.subsystems.agentCommunicationManager = createRootAgentCommunicationManager(root);
}

module.exports = {
    createRootSubsystems
}