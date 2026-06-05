
const chalk = require("chalk");
const path = require("path");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { spawnAgent } = require("../agent/spawn");
const { makeConditionalVariable } = require("../utilities/conditionalVariable");

function createRuntimeAgentSpawner(runtime)
{
    const gameLoopServer = runtime.subsystems.server;
    const serviceRegistry = runtime.subsystems.serviceRegistry;
    const runtimeAgentTracker = runtime.subsystems.agentTracker;

    let runtimeAgentSpawner = makeEventEmitter({
        runtime,
    });

    runtimeAgentSpawner.numAgents = 0;
    runtimeAgentSpawner.queues = [];

    runtimeAgentSpawner.spawn = async function(options) {
        options = options || {};

        runtime.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `Spawning agent:`, options);

        if (!("id" in options))
        {
            throw new Error(`Requires "id" in options`);
        }
        options.messages = options.messages || [];

        {
            const response = await fetch(`${runtime.config.root.url}/agentRegistry/has/${encodeURIComponent(options.id)}`);
            if (!response.ok)
            {
                throw new Error(`Failed to check id: ${await response.text()}`);
            }
            if (!await response.json())
            {
                throw new Error(`Not found agent in root agent registry with id: ${options.id}`);
            }
        }

        {
            if (runtimeAgentTracker.hasAgentTrackingData(options.id))
            {
                throw new Error(`${options.id} was already spawned`);
            }
        }

        runtimeAgentSpawner.numAgents += 1;

        let ready = false;
        const sync = makeConditionalVariable();

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
                runtime.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `${options.id} ready`);
                ready = true;
                sync.resolve();
            }
        )
        serviceInstance.on(
            "close",
            async (context) => {
                runtimeAgentSpawner.numAgents -= 1;
                runtime.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `${options.id} closed`);
                if (!ready)
                {
                    return sync.reject(new Error(`Unknown error, cannot spawn agent, the service instance quickly closed before agent ready`));
                }
            }
        )
        serviceInstance.on(
            "error",
            async (err) => {
                runtimeAgentSpawner.numAgents -= 1;
                if (ready)
                {
                    runtime.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `${options.id} crashed:`, err.message);
                }
                else
                {
                    runtime.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `${options.id} failed to spawn:`, err.message);
                    return sync.reject(err);
                }
            }
        )

        await sync.wait(
            () => {
                runtimeAgentSpawner.queues.push(
                    async () => {
                        (async () => {
                            try
                            {
                                await serviceInstance.passive(
                                    async () => {
                                        await spawnAgent({
                                            path: path.resolve(__dirname, "../../templates/agents/default"),
                                            serviceInstanceInfo: serviceInstance.getInfo()
                                        });
                                    }
                                );
                            }
                            catch(err)
                            {
                            }
                        })();
                    }
                );
            }
        );
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
            gameLoopServer.app.post("/agentSpawner/spawn", async (req, res) => {
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
                        ...req.body,
                    });
                    return res.status(200).send("Spawned agent successfully");
                }
                catch(err)
                {
                    return res.status(400).send(err.message);
                }
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
            await runtimeAgentSpawner.flush();
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