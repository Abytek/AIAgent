
const {} = require("abytek-aiagent");

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
            skill.tag("abytek.default")
                .depends("abytek.terminal");
        }
    );

    importAgentRuntimeTools(skill);
    importRootTools(skill);
    importAgentCommunication(skill);
    
    importTerminal(skill);
}