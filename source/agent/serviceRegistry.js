
const { createServiceRegistry } = require("../utilities/serviceRegistry");
const { makeConditionalVariable } = require("../utilities/conditionalVariable");

function createAgentServiceRegistry(agent)
{
    const gameLoopServer = agent.subsystems.server;

    let agentServiceRegistry = createServiceRegistry({
        gameLoopServer: gameLoopServer,
    });
    agentServiceRegistry.agent = agent;

    let agentLifetimeSync = makeConditionalVariable();
    agentServiceRegistry.service(
        "/runtimeManagement",
        async (context, agentDesc) => {
            await context.emit("ready");
            await agentLifetimeSync.wait();
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
            agentServiceRegistry.process(agent.spawnServiceInstanceInfo);
        }
    );
    return agentServiceRegistry;
}

module.exports = {
    createAgentServiceRegistry
};