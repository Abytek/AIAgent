
const chalk = require("chalk");
const { createAgentManager } = require("../shared/agentManager");

function createRootAgentManager(root)
{
    const rootAgentManager = createAgentManager({
        gameLoop: root,
        gameLoopServer: root.subsystems.server,
    })
    return rootAgentManager;
}

module.exports = {
    createRootAgentManager
}