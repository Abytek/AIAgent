
const { createRootServer } = require("./server");
const { createRootRuntimeManager } = require("./runtimeManager");
const { createRootAgentManager } = require("./agentManager");
const { createRootAgentMessageManager } = require("./agentMessageManager");

function createRootSubsystems(root)
{
    root.subsystems.server = createRootServer(root);
    root.subsystems.runtimeManager = createRootRuntimeManager(root);
    root.subsystems.agentManager = createRootAgentManager(root);
    root.subsystems.agentMessageManager = createRootAgentMessageManager(root);
}

module.exports = {
    createRootSubsystems
}