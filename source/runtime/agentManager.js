
const chalk = require("chalk");
const { createAgentManager } = require("../shared/agentManager");

function createRuntimeAgentManager(runtime)
{
    const runtimeAgentManager = createAgentManager({
        gameLoop: runtime,
        gameLoopServer: runtime.subsystems.server,
    })
    return runtimeAgentManager;
}

module.exports = {
    createRuntimeAgentManager
}