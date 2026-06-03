
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");

function createRuntimeAgentSpawner(runtime)
{
    const gameLoopServer = runtime.subsystems.server;
    const serviceRegistry = runtime.subsystems.serviceRegistry;
    const runtimeAgentManager = runtime.subsystems.agentManager;

    let runtimeAgentSpawner = makeEventEmitter({
        runtime,
    });

    runtimeAgentSpawner.numAgents = 0;
    runtimeAgentSpawner.queues = [];

    runtimeAgentSpawner.spawn = async function(options) {
        options = options || {};

        options.id = options.id || runtimeAgentManager.generateAgentId();
        options.messages = options.messages || [];
        options.tags = options.tags || [];

        runtime.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `Spawning agent:`, options);

        runtimeAgentSpawner.numAgents += 1;

        const sync = {
            read: false,
            resolve: null,
            reject: null
        };
        sync.wait = () => {
            return new Promise(
                (resolve, reject) => {
                    sync.resolve = resolve;
                    sync.reject = reject;
                }
            );
        }

        const serviceInstance = serviceRegistry.serviceInstance(
            "/runtimeManagement",
            options
        );
        serviceInstance.on(
            "open",
            async (context) => {
                runtime.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `${options.id} opened`);
            }
        )
        serviceInstance.on(
            "ready",
            async (context) => {
                runtime.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `Agent ready:`, options.id);
                sync.ready = true;
                sync.resolve();
            }
        )
        serviceInstance.on(
            "close",
            async (context) => {
                runtimeAgentSpawner.numAgents -= 1;
                runtime.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `${options.id} closed`);
                if (!sync.ready)
                {
                    return sync.reject(new Error(`Unknown error, cannot spawn agent, the service instance quickly closed before agent ready`));
                }
            }
        )
        serviceInstance.on(
            "error",
            async (err) => {
                runtimeAgentSpawner.numAgents -= 1;
                runtime.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `${options.id} failed to spawn`);
                return sync.reject(err);
            }
        )

        runtimeAgentSpawner.queues.push(
            async () => {
                serviceInstance.passive(
                    async () => {
                        await serviceRegistry.process(serviceInstance.getInfo());
                    }
                );
            }
        );

        await sync.wait();
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
    runtimeAgentSpawner.syncAgents = async function() {
        await new Promise(
            (resolve) => 
            {
                let sync = null;
                sync = () => setTimeout(
                    () => {
                        if (runtimeAgentSpawner.numAgents > 0)
                        {
                            sync();
                        }
                        else 
                        {
                            resolve();
                        }
                    },
                    1000
                );
                sync();
            }
        );
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
            await runtimeAgentSpawner.flush();
        }
    );
    runtime.on(
        "tick",
        async () => {
        }
    );
    runtime.on(
        "release",
        async () => {
            await runtimeAgentSpawner.flush();
            await runtimeAgentSpawner.syncAgents();
        }
    );
    return runtimeAgentSpawner;
}

module.exports = {
    createRuntimeAgentSpawner
};