
const {} = require("abytek-aiagent");

const { importMemory } = require("./memory");

const { importSelfControl } = require("./selfControl");
const { importRoot } = require("./root");
const { importRootAgentRegistry } = require("./rootAgentRegistry");
const { importRootAgentSpawnerManager } = require("./rootAgentSpawnerManager");
const { importRootAgentTracker } = require("./rootAgentTracker");
const { importRuntime } = require("./runtime");
const { importRuntimeAgentTracker } = require("./runtimeAgentTracker");
const { importRuntimeSkillRegistry } = require("./runtimeSkillRegistry");
const { importDate } = require("./date");
const { importCommunication } = require("./communication");

const { importTerminal } = require("./terminal");

module.exports = skill => {

    const agent = skill.agent;
    
    importMemory(skill);

    importSelfControl(skill);
    importRoot(skill);
    importRootAgentRegistry(skill);
    importRootAgentSpawnerManager(skill);
    importRootAgentTracker(skill);
    importRuntime(skill);
    importRuntimeAgentTracker(skill);
    importRuntimeSkillRegistry(skill);
    importDate(skill);
    importCommunication(skill);
    
    importTerminal(skill);
}