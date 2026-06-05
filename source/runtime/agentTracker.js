
const chalk = require("chalk");
const { createAgentTracker } = require("../shared/agentTracker");

function createRuntimeAgentTracker(runtime)
{
    const runtimeAgentTracker = createAgentTracker({
        gameLoop: runtime,
        gameLoopServer: runtime.subsystems.server,
        parentId: runtime.id,
    })
    return runtimeAgentTracker;
}

module.exports = {
    createRuntimeAgentTracker
}