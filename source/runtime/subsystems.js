
const { createRuntimeServer } = require("./server");
const { createRuntimeSkillManager } = require("./skillManager");

function createRuntimeSubsystems(runtime)
{
    runtime.subsystems.server = createRuntimeServer(runtime);
    runtime.subsystems.skillManager = createRuntimeSkillManager(runtime);
}

module.exports = {
    createRuntimeSubsystems
}