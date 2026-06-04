
const { coreSetupFramework } = require("./framework");
const { coreSetupAgentIdentity } = require("./agentIdentity");

const { coreSetupAgentRuntimeTools } = require("./agentRuntimeTools");
const { coreSetupRootTools } = require("./rootTools");
const { coreSetupAgentCommunication } = require("./agentCommunication");

const { coreSetupTerminal } = require("./terminal");

function coreSetup(agent)
{
    coreSetupFramework(agent);
    coreSetupAgentIdentity(agent);

    coreSetupAgentRuntimeTools(agent);
    coreSetupRootTools(agent);
    coreSetupAgentCommunication(agent);
    
    coreSetupTerminal(agent);
}

module.exports = {
    coreSetup
}