
const { createRuntimeServer } = require("./server");
const { createRuntimeServiceRegistry } = require("./serviceRegistry");
const { createRuntimeTracking } = require("./tracking");
const { createRuntimeAgentManager } = require("./agentManager");
const { createRuntimeAgentSpawner } = require("./agentSpawner");

function createRuntimeSubsystems(runtime)
{
    runtime.subsystems.server = createRuntimeServer(runtime);
    runtime.subsystems.serviceRegistry = createRuntimeServiceRegistry(runtime);
    runtime.subsystems.tracking = createRuntimeTracking(runtime);
    runtime.subsystems.agentManager = createRuntimeAgentManager(runtime);
    runtime.subsystems.agentSpawner = createRuntimeAgentSpawner(runtime);
}

module.exports = {
    createRuntimeSubsystems
}