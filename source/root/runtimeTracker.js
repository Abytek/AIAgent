
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { finalizeRootRuntimeInfo } = require("./runtime");

function createRootRuntimeTracker(root)
{
    const rootServer = root.subsystems.server;

    const rootRuntimeTracker = makeEventEmitter({
        root,
        runtimeinfos: new Map(), // key: runtime id, value: runtime info
        socketToRuntimeId: new Map(), // key: socket IO, value: runtime id
    })
    rootRuntimeTracker.hasRuntimeInfo = function(runtimeId) {
        return rootRuntimeTracker.runtimeinfos.has(runtimeId);
    }
    rootRuntimeTracker.findRuntimeInfo = function(runtimeId) {
        if (!rootRuntimeTracker.hasRuntimeInfo(runtimeId))
        {
            return null;
        }
        return rootRuntimeTracker.runtimeinfos.get(runtimeId);
    }
    rootRuntimeTracker.getRuntimeInfo = function(runtimeId) {
        if (!rootRuntimeTracker.hasRuntimeInfo(runtimeId))
        {
            throw new Error(`Not found runtime: ${runtimeId}`);
        }
        return rootRuntimeTracker.runtimeinfos.get(runtimeId);
    }

    // root runtime manager events
    rootRuntimeTracker.on(
        "registerRuntime",
        async (socket, runtimeInfo) => {
            root.logger.log([ chalk.rgb(60, 200, 30)("Runtime") ], `Registered runtime:`, runtimeInfo);
            rootRuntimeTracker.runtimeinfos.set(
                runtimeInfo.id, 
                runtimeInfo
            );
            rootRuntimeTracker.socketToRuntimeId.set(
                socket,
                runtimeInfo.id
            );
        }
    );
    rootRuntimeTracker.on(
        "unregisterRuntime",
        async (socket, runtimeInfo) => {
            root.logger.log([ chalk.rgb(60, 200, 30)("Runtime") ], `Unregistered runtime:`, chalk.rgb(200, 70, 150)(runtimeInfo.id));
            rootRuntimeTracker.socketToRuntimeId.delete(runtimeInfo.id);
            rootRuntimeTracker.runtimeinfos.delete(runtimeInfo.id);
        }
    );

    // 
    async function registerRuntime(socket, runtimeInfo)
    {
        await rootRuntimeTracker.emit("registerRuntime", socket, runtimeInfo);
    }
    async function unregisterRuntime(socket, runtimeInfo)
    {
        await rootRuntimeTracker.emitReversed("unregisterRuntime", socket, runtimeInfo);
    }

    // root server events
    rootServer.on(
        "setup",
        async () => {
            rootServer.app.get("/runtimeInfos", (req, res) => {
                let runtimeInfos = [];
                rootRuntimeTracker.runtimeinfos.forEach(
                    value => {
                        runtimeInfos.push(value);
                    }
                );
                res.status(200).json(runtimeInfos);
            });
        }
    );
    rootServer.on(
        "socketClient_connected",
        async (socket) => {
            socket.on(
                "registerRuntime",
                async (runtimeInfo, ack) => {
                    runtimeInfo = finalizeRootRuntimeInfo(runtimeInfo);

                    try 
                    {
                        await registerRuntime(socket, runtimeInfo);
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
                        return ack({ status: 200, message: `Registered runtime ${runtimeInfo.id}` });
                    }
                }
            );
            socket.on(
                "unregisterRuntime",
                async (runtimeId, ack) => {
                    if (!rootRuntimeTracker.runtimeinfos.has(runtimeId))
                    {
                        if (ack)
                        {
                            return ack({ status: 400, message: `Not found runtime to unregister: ${runtimeId}` });
                        }
                    }

                    const runtimeInfo = rootRuntimeTracker.runtimeinfos.get(runtimeId);

                    try 
                    {
                        await unregisterRuntime(socket, runtimeInfo);
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
            const runtimeInfo = rootRuntimeTracker.runtimeinfos.get(runtimeId);
            await unregisterRuntime(socket, runtimeInfo);
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