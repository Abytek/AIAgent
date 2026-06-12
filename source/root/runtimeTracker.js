
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { finalizeRootRuntimeTrackingData } = require("./runtimeTrackingData");

function createRootRuntimeTracker(root)
{
    const rootServer = root.subsystems.server;

    const rootRuntimeTracker = makeEventEmitter({
        root,
        runtimeTrackingDatas: new Map(), // key: runtime id, value: runtime info
        socketToRuntimeId: new Map(), // key: socket IO, value: runtime id
    })
    rootRuntimeTracker.list = function() {
        return [ ...rootRuntimeTracker.runtimeTrackingDatas.values() ];
    }
    rootRuntimeTracker.has = function(runtimeId) {
        return rootRuntimeTracker.runtimeTrackingDatas.has(runtimeId);
    }
    rootRuntimeTracker.find = function(runtimeId) {
        if (!rootRuntimeTracker.has(runtimeId))
        {
            return null;
        }
        return rootRuntimeTracker.runtimeTrackingDatas.get(runtimeId);
    }
    rootRuntimeTracker.get = function(runtimeId) {
        if (!rootRuntimeTracker.has(runtimeId))
        {
            throw new Error(`Not found runtime: ${runtimeId}`);
        }
        return rootRuntimeTracker.runtimeTrackingDatas.get(runtimeId);
    }

    // root runtime manager events
    rootRuntimeTracker.on(
        "registerRuntime",
        async (socket, runtimeTrackingData) => {
            root.logger.log([ chalk.rgb(60, 200, 30)("Runtime") ], `Registered runtime:`, runtimeTrackingData);
            rootRuntimeTracker.runtimeTrackingDatas.set(
                runtimeTrackingData.id, 
                runtimeTrackingData
            );
            rootRuntimeTracker.socketToRuntimeId.set(
                socket,
                runtimeTrackingData.id
            );
        }
    );
    rootRuntimeTracker.on(
        "unregisterRuntime",
        async (socket, runtimeTrackingData) => {
            root.logger.log([ chalk.rgb(60, 200, 30)("Runtime") ], `Unregistered runtime:`, chalk.rgb(200, 70, 150)(runtimeTrackingData.id));
            rootRuntimeTracker.socketToRuntimeId.delete(runtimeTrackingData.id);
            rootRuntimeTracker.runtimeTrackingDatas.delete(runtimeTrackingData.id);
        }
    );

    // 
    async function registerRuntime(socket, runtimeTrackingData)
    {
        await rootRuntimeTracker.emit("registerRuntime", socket, runtimeTrackingData);
    }
    async function unregisterRuntime(socket, runtimeTrackingData)
    {
        await rootRuntimeTracker.emitReversed("unregisterRuntime", socket, runtimeTrackingData);
    }

    // root server events
    rootServer.on(
        "setup",
        async () => {
            rootServer.app.get("/runtimeTracker/list", (req, res) => {
                res.status(200).json(rootRuntimeTracker.list());
            });
            rootServer.app.get("/runtimeTracker/has/:id", async (req, res) =>
            {
                if (!("id" in req.params))
                {
                    return res.status(400).send(`Require "id" parameter`);
                }
                const id = req.params.id;
                res.status(200).json(rootruntimeTracker.has(id));
            });
            rootServer.app.get("/runtimeTracker/get/:id", async (req, res) =>
            {
                if (!("id" in req.params))
                {
                    return res.status(400).send(`Require "id" parameter`);
                }
                const id = req.params.id;
                try
                {
                    res.status(200).json(rootruntimeTracker.get(id));
                }
                catch(err)
                {
                    res.status(400).send(err.message);
                }
            });
        }
    );
    rootServer.on(
        "socketClient_connected",
        async (socket) => {
            socket.on(
                "registerRuntime",
                async (runtimeTrackingData, ack) => {
                    runtimeTrackingData = finalizeRootRuntimeTrackingData(runtimeTrackingData);

                    try 
                    {
                        await registerRuntime(socket, runtimeTrackingData);
                    }
                    catch(err)
                    {
                        if (ack)
                        {
                            return ack({ status: 400, message: err.message });
                        }
                    }
                    if (ack)
                    {
                        return ack({ status: 200, message: `Registered runtime ${runtimeTrackingData.id}` });
                    }
                }
            );
            socket.on(
                "unregisterRuntime",
                async (runtimeId, ack) => {
                    if (!rootRuntimeTracker.runtimeTrackingDatas.has(runtimeId))
                    {
                        if (ack)
                        {
                            return ack({ status: 400, message: `Not found runtime to unregister: ${runtimeId}` });
                        }
                    }

                    const runtimeTrackingData = rootRuntimeTracker.runtimeTrackingDatas.get(runtimeId);

                    try 
                    {
                        await unregisterRuntime(socket, runtimeTrackingData);
                    }
                    catch(err)
                    {
                        if (ack)
                        {
                            return ack({ status: 400, message: err.message });
                        }
                    }
                    if (ack)
                    {
                        return ack({ status: 200, message: `Unregistered runtime ${runtimeId}` });
                    }
                }
            );
        }
    );
    rootServer.on(
        "socketClient_disconnected",
        async (socket, reason) => {
            if (!rootRuntimeTracker.socketToRuntimeId.has(socket))
            {
                return;
            }

            const runtimeId = rootRuntimeTracker.socketToRuntimeId.get(socket);
            const runtimeTrackingData = rootRuntimeTracker.runtimeTrackingDatas.get(runtimeId);
            await unregisterRuntime(socket, runtimeTrackingData);
        }
    );

    // root events
    root.on(
        "init",
        async () => {
        }
    );
    root.on(
        "release",
        async () => {
        }
    );
    return rootRuntimeTracker;
}

module.exports = {
    createRootRuntimeTracker
}