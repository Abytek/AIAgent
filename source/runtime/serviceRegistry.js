
const { createServiceRegistry } = require("../utilities/serviceRegistry");

function createRuntimeServiceRegistry(runtime)
{
    const gameLoopServer = runtime.subsystems.server;

    let runtimeServiceRegistry = createServiceRegistry({
        gameLoopServer: gameLoopServer,
    });
    runtimeServiceRegistry.runtime = runtime;

    return runtimeServiceRegistry;
}

module.exports = {
    createRuntimeServiceRegistry
};