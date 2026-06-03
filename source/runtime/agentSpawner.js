
const { makeEventEmitter } = require("../utilities/eventEmitter");

function createRuntimeAgentSpawner(runtime)
{
    const gameLoopServer = runtime.subsystems.server;
    const serviceRegistry = runtime.subsystems.serviceRegistry;
    const runtimeAgentManager = runtime.subsystems.agentManager;

    let runtimeAgentSpawner = makeEventEmitter({
        runtime,
    });

    runtimeAgentSpawner.agentTrackers = [];
    runtimeAgentSpawner.queues = [];

    const fakeSpawnService = serviceRegistry.service(
        "/runtimeManagement",
        async (context, options) => {
            console.log(options);
        }
    );

    runtimeAgentSpawner.spawn = async function(options) {
        options = options || {};

        options.id = options.id || runtimeAgentManager.generateAgentId();
        options.messages = options.messages || [];
        options.tags = options.tags || [];

        console.log(`Spawning agent:`, options);

        const serviceInstance = serviceRegistry.serviceInstance(
            "/runtimeManagement",
            options
        );
        await new Promise(
            (resolve, reject) => {
                serviceInstance.on(
                    "ready",
                    async (context) => {
                        resolve();
                    }
                )
                serviceInstance.on(
                    "error",
                    async (err) => {
                        reject(err);
                    }
                )
            }
        )

        runtimeAgentSpawner.queues.push(
            async () => {
                await serviceInstance.passive(
                    async () => {
                        await serviceRegistry.process(serviceInstance.getInfo());
                    }
                );
            }
        );
        return options.id;
    }
    runtimeAgentSpawner.flush = async function() {
        const commands = [ ...runtimeAgentSpawner.queues ];
        runtimeAgentSpawner.queues = [];

        for (const command of commands)
        {
            await command();
        }
    }

    // game loop server events
    gameLoopServer.on(
        "setup",
        async () => {
            gameLoopServer.app.post("/agent/spawn", async (req, res) => {
                if (req.body == null)
                {
                    return res.status(400).send(`Requires request body`);
                }
                if (typeof req.body !== "object")
                {
                    return res.status(400).send(`Requires object request body`);
                }

                try
                {
                    await runtimeAgentSpawner.spawn({
                        ...req.body
                    });
                }
                catch(err)
                {
                    res.status(400).send(err.message);
                }

                res.status(200).send(id);
            });
        }
    );

    // runtime events
    runtime.on(
        "init",
        async () => {
        }
    );
    runtime.on(
        "ready",
        async () => {
            await runtimeAgentSpawner.spawn({
            });
        }
    );
    runtime.on(
        "tick",
        async () => {
            await runtimeAgentSpawner.flush();
        }
    );
    runtime.on(
        "release",
        async () => {
        }
    );
    return runtimeAgentSpawner;
}

module.exports = {
    createRuntimeAgentSpawner
};