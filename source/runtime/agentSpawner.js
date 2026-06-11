
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { spawnAgent } = require("../agent/spawn");
const { makeConditionalVariable } = require("../utilities/conditionalVariable");

function createRuntimeAgentSpawner(runtime)
{
    const gameLoopServer = runtime.subsystems.server;
    const serviceRegistry = runtime.subsystems.serviceRegistry;
    const skillRegistry = runtime.subsystems.skillRegistry;
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

        let agentInfo = null;
        {
            const response = await fetch(`${runtime.config.root.url}/agentRegistry/get/${encodeURIComponent(options.id)}`);
            if (!response.ok)
            {
                throw new Error(`Failed to get agent info with id ${options.id}: ${await response.text()}`);
            }
            agentInfo = await response.json();
        }

        {
            if (runtimeAgentTracker.has(options.id))
            {
                throw new Error(`${options.id} was already spawned`);
            }
        }

        runtimeAgentSpawner.numAgents += 1;

        const agentDataDirectory = path.resolve(runtime.dataDirectory, "agents", options.id);
        fs.mkdirSync(agentDataDirectory, { recursive: true });

        const parsedOptions = {
            ...options,
            ...agentInfo,
            dataDirectory: agentDataDirectory,
            rootURL: runtime.config.root.url,
            runtimeURL: runtime.subsystems.server.url,
            skillReferences: skillRegistry.list(),
        };

        let ready = false;
        const sync = makeConditionalVariable();

        const serviceInstance = serviceRegistry.serviceInstance(
            "/runtimeManagement",
            parsedOptions
        );
        serviceInstance.on(
            "open",
            async (context) => {
                runtime.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `${parsedOptions.id} opened`);
            }
        )
        serviceInstance.on(
            "ready",
            async (context) => {
                runtime.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `${parsedOptions.id} ready`);
                ready = true;
                sync.resolve();
            }
        )
        serviceInstance.on(
            "close",
            async (context) => {
                runtimeAgentSpawner.numAgents -= 1;
                runtime.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `${parsedOptions.id} closed`);
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
                    runtime.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `${parsedOptions.id} crashed:`, err.message);
                }
                else
                {
                    runtime.logger.log([ chalk.rgb(60, 200, 30)("Agent") ], `${parsedOptions.id} failed to spawn:`, err.message);
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
                                            path: path.resolve(__dirname, "../../templates/agent/default"),
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