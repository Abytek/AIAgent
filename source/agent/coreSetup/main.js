
const { coreSetupFramework } = require("./framework");
const { coreSetupAgentIdentity } = require("./agentIdentity");

const { coreSetupAgentConnectionTools } = require("./agentConnectionTools");
const { coreSetupAgentRuntimeTools } = require("./agentRuntimeTools");
const { coreSetupRootManagerTools } = require("./rootManagerTools");
const { coreSetupAgentCommunicationTools } = require("./agentCommunicationTools");

const { coreSetupLegacyPowershellTools } = require("./legacyPowershellTools");
const { coreSetupTerminal } = require("./terminal");

function coreSetup(agent)
{
    coreSetupFramework(agent);
    coreSetupAgentIdentity(agent);

    coreSetupAgentConnectionTools(agent);
    coreSetupAgentRuntimeTools(agent);
    coreSetupRootManagerTools(agent);
    coreSetupAgentCommunicationTools(agent);
    
    // coreSetupLegacyPowershellTools(agent);
    coreSetupTerminal(agent);
}

module.exports = {
    coreSetup
}