
const { coreSetupFramework } = require("./framework");
const { coreSetupAgentIdentity } = require("./agentIdentity");

const { coreSetupAgentConnectionTools } = require("./agentConnectionTools");
const { coreSetupAgentLifecycleTools } = require("./agentLifecycleTools");
const { coreSetupRootManagerTools } = require("./rootManagerTools");
const { coreSetupAgentCommunicationTools } = require("./agentCommunicationTools");

const { coreSetupLegacyPowershellTools } = require("./legacyPowershellTools");

function coreSetup(agent)
{
    coreSetupFramework(agent);
    coreSetupAgentIdentity(agent);

    coreSetupAgentConnectionTools(agent);
    coreSetupAgentLifecycleTools(agent);
    coreSetupRootManagerTools(agent);
    coreSetupAgentCommunicationTools(agent);
    
    coreSetupLegacyPowershellTools(agent);
}

module.exports = {
    coreSetup
}