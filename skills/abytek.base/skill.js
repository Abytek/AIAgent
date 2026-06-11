
const {} = require("abytek-aiagent");

const { importMemory } = require("./memory");

const { importAgentRuntimeTools } = require("./agentRuntimeTools");
const { importRootTools } = require("./rootTools");
const { importRuntimeTools } = require("./runtimeTools");
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

    importMemory(skill);

    importAgentRuntimeTools(skill);
    importRootTools(skill);
    importRuntimeTools(skill);
    importAgentCommunication(skill);
    
    importTerminal(skill);
}