
const chalk = require("chalk");
const { createAgentTracker } = require("../shared/agentTracker");

function createRootAgentTracker(root)
{
    const rootAgentTracker = createAgentTracker({
        gameLoop: root,
        gameLoopServer: root.subsystems.server,
    })
    return rootAgentTracker;
}

module.exports = {
    createRootAgentTracker
}