
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { finalizeRootRuntimeInfo } = require("./runtime");

function createRootRuntimeManager(root)
{
    const rootServer = root.subsystems.server;

    const rootRuntimeManager = makeEventEmitter({
        root,
        runtimeinfos: new Map(), // key: runtime id, value: runtime info
        socketToRuntimeId: new Map(), // key: socket IO, value: runtime id
    })
    rootRuntimeManager.hasRuntimeInfo = function(runtimeId) {
        return rootRuntimeManager.runtimeinfos.has(runtimeId);
    }
    rootRuntimeManager.findRuntimeInfo = function(runtimeId) {
        if (!rootRuntimeManager.hasRuntimeInfo(runtimeId))
        {
            return null;
        }
        return rootRuntimeManager.runtimeinfos.get(runtimeId);
    }
    rootRuntimeManager.getRuntimeInfo = function(runtimeId) {
        if (!rootRuntimeManager.hasRuntimeInfo(runtimeId))
        {
            throw new Error(`Not found runtime: ${runtimeId}`);
        }
        return rootRuntimeManager.runtimeinfos.get(runtimeId);
    }

    // root runtime manager events
    rootRuntimeManager.on(
        "registerRuntime",
        async (socket, runtimeInfo) => {
            root.logger.log([ chalk.rgb(60, 200, 30)("Runtime") ], `Registered runtime:`, runtimeInfo);
            rootRuntimeManager.runtimeinfos.set(
                runtimeInfo.id, 
                runtimeInfo
            );
            rootRuntimeManager.socketToRuntimeId.set(
                socket,
                runtimeInfo.id
            );
        }
    );
    rootRuntimeManager.on(
        "unregisterRuntime",
        async (socket, runtimeInfo) => {
            root.logger.log([ chalk.rgb(60, 200, 30)("Runtime") ], `Unregistered runtime:`, chalk.rgb(200, 70, 150)(runtimeInfo.id));
            rootRuntimeManager.socketToRuntimeId.delete(runtimeInfo.id);
            rootRuntimeManager.runtimeinfos.delete(runtimeInfo.id);
        }
    );

    // 
    async function registerRuntime(socket, runtimeInfo)
    {
        await rootRuntimeManager.emit("registerRuntime", socket, runtimeInfo);
    }
    async function unregisterRuntime(socket, runtimeInfo)
    {
        await rootRuntimeManager.emitReversed("unregisterRuntime", socket, runtimeInfo);
    }

    // root server events
    rootServer.on(
        "setup",
        async () => {
            rootServer.app.get("/runtimeInfos", (req, res) => {
                let runtimeInfos = [];
                rootRuntimeManager.runtimeinfos.forEach(
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
                    if (!rootRuntimeManager.runtimeinfos.has(runtimeId))
                    {
                        if (ack)
                        {
                            return ack({ status: 400, message: `Not found runtime to unregister: ${runtimeId}` });
                        }
                    }

                    const runtimeInfo = rootRuntimeManager.runtimeinfos.get(runtimeId);

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
            if (!rootRuntimeManager.socketToRuntimeId.has(socket))
            {
                return;
            }

            const runtimeId = rootRuntimeManager.socketToRuntimeId.get(socket);
            const runtimeInfo = rootRuntimeManager.runtimeinfos.get(runtimeId);
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
    return rootRuntimeManager;
}

module.exports = {
    createRootRuntimeManager
}