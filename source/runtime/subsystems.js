
const { createRuntimeServer } = require("./server");
const { createRuntimeServiceRegistry } = require("./serviceRegistry");
const { createRuntimeTracking } = require("./tracking");
const { createRuntimeAgentTracker } = require("./agentTracker");
const { createRuntimeAgentSpawner } = require("./agentSpawner");

function createRuntimeSubsystems(runtime)
{
    runtime.subsystems = {};
    runtime.subsystems.server = createRuntimeServer(runtime);
    runtime.subsystems.serviceRegistry = createRuntimeServiceRegistry(runtime);
    runtime.subsystems.tracking = createRuntimeTracking(runtime);
    runtime.subsystems.agentTracker = createRuntimeAgentTracker(runtime);
    runtime.subsystems.agentSpawner = createRuntimeAgentSpawner(runtime);
}

module.exports = {
    createRuntimeSubsystems
}