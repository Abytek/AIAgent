
const { coreSetupFramework } = require("./framework");
const { coreSetupAgentIdentity } = require("./agentIdentity");

const { coreSetupAgentRuntimeTools } = require("./agentRuntimeTools");
const { coreSetupRootTools } = require("./rootTools");
const { coreSetupAgentCommunicationTools } = require("./agentCommunicationTools");

const { coreSetupTerminal } = require("./terminal");

function coreSetup(agent)
{
    coreSetupFramework(agent);
    coreSetupAgentIdentity(agent);

    coreSetupAgentRuntimeTools(agent);
    coreSetupRootTools(agent);
    coreSetupAgentCommunicationTools(agent);
    
    coreSetupTerminal(agent);
}

module.exports = {
    coreSetup
}