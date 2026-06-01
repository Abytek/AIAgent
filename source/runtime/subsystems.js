
const { createRuntimeServer } = require("./server");
const { createRuntimeTracking } = require("./tracking");
const { createRuntimeSkillManager } = require("./skillManager");

function createRuntimeSubsystems(runtime)
{
    runtime.subsystems.server = createRuntimeServer(runtime);
    runtime.subsystems.tracking = createRuntimeTracking(runtime);
    runtime.subsystems.skillManager = createRuntimeSkillManager(runtime);
}

module.exports = {
    createRuntimeSubsystems
}