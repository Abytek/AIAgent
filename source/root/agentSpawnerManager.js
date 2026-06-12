
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");

function createRootAgentSpawnerManager(root)
{
    const rootServer = root.subsystems.server;
    const agentRegistry = root.subsystems.agentRegistry;
    const runtimeTracker = root.subsystems.runtimeTracker;

    const rootAgentSpawnerManager = makeEventEmitter({
        root,
    })

    // root server events
    rootServer.on(
        "setup",
        async () => {
            rootServer.app.post("/agentSpawnerManager/spawn", async (req, res) => {
                if (req.body == null)
                {
                    return res.status(400).send(`Requires request body`);
                }
                if (typeof req.body !== "object")
                {
                    return res.status(400).send(`Requires object request body`);
                }

                const agentId = req.body.id;
                if (agentId == null)
                {
                    return res.status(400).send(`Requires "id" in request body`);
                }

                if (!agentRegistry.has(agentId))
                {
                    return res.status(400).send(`Not registered agent with id: ${agentId}`);
                }
                const agentInfo = agentRegistry.get(agentId);

                if (!runtimeTracker.has(agentInfo.runtimeId))
                {
                    return res.status(400).send(`Not found a connected runtimes with id: ${agentInfo.runtimeId}`);
                }
                const runtimeTrackingData = runtimeTracker.get(agentInfo.runtimeId);

                const agentMessages = req.body.messages || [];

                try {
                    const targetRes = await fetch(`${runtimeTrackingData.url}/agentSpawner/spawn`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            id: agentId,
                            messages: agentMessages,
                        }),
                    });

                    if (targetRes.ok) {
                        res.status(200).send(await targetRes.text() || "");
                    } else {
                        res.status(400).send(await targetRes.text() || "");
                    }
                } catch (err) {
                    res.status(500).send(err.message);
                }
            });
            rootServer.app.post("/agentSpawnerManager/kill", async (req, res) => {
                if (req.body == null)
                {
                    return res.status(400).send(`Requires request body`);
                }
                if (typeof req.body !== "object")
                {
                    return res.status(400).send(`Requires object request body`);
                }

                const agentId = req.body.id;
                if (agentId == null)
                {
                    return res.status(400).send(`Requires "id" in request body`);
                }

                if (!agentRegistry.has(agentId))
                {
                    return res.status(400).send(`Not registered agent with id: ${agentId}`);
                }
                const agentInfo = agentRegistry.get(agentId);

                if (!runtimeTracker.has(agentInfo.runtimeId))
                {
                    return res.status(400).send(`Not found a connected runtimes with id: ${agentInfo.runtimeId}`);
                }
                const runtimeTrackingData = runtimeTracker.get(agentInfo.runtimeId);

                try {
                    const targetRes = await fetch(`${runtimeTrackingData.url}/agentSpawner/kill`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            id: agentId,
                        }),
                    });

                    if (targetRes.ok) {
                        res.status(200).send(await targetRes.text() || "");
                    } else {
                        res.status(400).send(await targetRes.text() || "");
                    }
                } catch (err) {
                    res.status(500).send(err.message);
                }
            });
        }
    );
    return rootAgentSpawnerManager;
}

module.exports = {
    createRootAgentSpawnerManager
}