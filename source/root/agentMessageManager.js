
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { finalizeRootAgentInfo } = require("./agent");

function createRootAgentMessageManager(root)
{
    const rootServer = root.subsystems.server;
    const agentManager = root.subsystems.agentManager;

    const rootAgentMessageManager = makeEventEmitter({
        root,
    })

    // root server events
    rootServer.on(
        "setup",
        async () => {
        }
    );
    return rootAgentManager;
}

module.exports = {
    createRootAgentManager
}