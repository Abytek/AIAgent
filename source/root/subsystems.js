
const { createRootServer } = require("./server");
const { createRootRuntimeManager } = require("./runtimeManager");

function createRootSubsystems(root)
{
    root.subsystems.server = createRootServer(root);
    root.subsystems.runtimeManager = createRootRuntimeManager(root);
}

module.exports = {
    createRootSubsystems
}