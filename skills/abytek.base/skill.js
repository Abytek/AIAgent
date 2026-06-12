
const {} = require("abytek-aiagent");

const { importMemory } = require("./memory");

const { importSelfControl } = require("./selfControl");
const { importRoot } = require("./root");
const { importRuntime } = require("./runtime");
const { importCommunication } = require("./communication");

const { importTerminal } = require("./terminal");

module.exports = skill => {

    const agent = skill.agent;
    
    skill.setup({
        name: "abytek.base"
    });
    
    importMemory(skill);

    importSelfControl(skill);
    importRoot(skill);
    importRuntime(skill);
    importCommunication(skill);
    
    importTerminal(skill);
}