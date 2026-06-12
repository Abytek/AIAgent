
const {} = require("abytek-aiagent");

const { importMemory } = require("./core/memory");

const { importSelfControl } = require("./core/selfControl");
const { importRoot } = require("./core/root");
const { importRuntime } = require("./core/runtime");
const { importCommunication } = require("./core/communication");

const { importTerminal } = require("./core/terminal");

module.exports = skill => {

    const agent = skill.agent;
    
    skill.setup({
        name: "abytek.base"
    });
    skill.on(
        "construct",
        async () => {
            skill.tag("abytek.default")
                .depends("abytek.memory")
                .depends("abytek.communication")
                .depends("abytek.terminal");
        }
    );

    importMemory(skill);

    importSelfControl(skill);
    importRoot(skill);
    importRuntime(skill);
    importCommunication(skill);
    
    importTerminal(skill);
}