
const { createRootServer } = require("./server");
const { createRootRuntimeManager } = require("./runtimeManager");

function createRootManagerSubsystems(rootManager)
{
    rootManager.subsystems.server = createRootServer(rootManager);
    rootManager.subsystems.runtimeManager = createRootRuntimeManager(rootManager);
}

module.exports = {
    createRootManagerSubsystems
}