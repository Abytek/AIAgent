
const { createServiceRegistry } = require("../utilities/serviceRegistry");

function createAgentServiceRegistry(agent)
{
    const gameLoopServer = agent.subsystems.server;

    let agentServiceRegistry = createServiceRegistry({
        gameLoopServer: gameLoopServer,
    });
    agentServiceRegistry.agent = agent;

    let agentLifetimeSync = {
        resolve: null,
    }
    agentServiceRegistry.service(
        "/runtimeManagement",
        async (context, agentDesc) => {
            await context.emit("ready");
            await new Promise(
                resolve => {
                    agentLifetimeSync.resolve = resolve;
                }
            );
        }
    );

    agent.on(
        "release",
        async () => {
            agentLifetimeSync.resolve();
        }
    )
    agent.on(
        "ready",
        async () => {
            await agentServiceRegistry.process(agent.spawnServiceInstanceInfo);
        }
    );
    return agentServiceRegistry;
}

module.exports = {
    createAgentServiceRegistry
};