
const {} = require("abytek-aiagent");

const { importFramework } = require("./framework");
const { importAgentIdentity } = require("./agentIdentity");

const { importAgentRuntimeTools } = require("./agentRuntimeTools");
const { importRootTools } = require("./rootTools");
const { importAgentCommunication } = require("./agentCommunication");

const { importTerminal } = require("./terminal");

module.exports = skill => {

    const agent = skill.agent;
    
    skill.setup({
        name: "abytek.base"
    });
    skill.on(
        "construct",
        async () => {
            skill.tag("abytek.default");
        }
    );

    importFramework(skill);
    importAgentIdentity(skill);

    importAgentRuntimeTools(skill);
    importRootTools(skill);
    importAgentCommunication(skill);
    
    importTerminal(skill);
}