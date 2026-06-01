
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { finalizeRootRuntimeInfo } = require("./runtime");

function createRootRuntimeManager(rootManager)
{
    const rootServer = rootManager.subsystems.server;

    const rootRuntimeManager = makeEventEmitter({
        rootManager,
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

    // rootManager runtime manager events
    rootRuntimeManager.on(
        "registerRuntime",
        async (socket, runtimeInfo) => {
            rootManager.logger.log([ chalk.rgb(60, 200, 30)("Runtime") ], `Registered runtime:`, runtimeInfo);
            rootRuntimeManager.runtimeinfos.set(
                runtimeInfo.id, 
                runtimeInfo
            );
        }
    );
    rootRuntimeManager.on(
        "unregisterRuntime",
        async (socket, runtimeInfo) => {
            rootRuntimeManager.runtimeinfos.delete(runtimeInfo.id);
            rootManager.logger.log([ chalk.rgb(60, 200, 30)("Runtime") ], `Unregistered runtime:`, chalk.rgb(200, 70, 150)(runtimeInfo.id));
        }
    );

    // 
    function registerRuntime(socket, runtimeInfo)
    {
        rootRuntimeManager.emit("registerRuntime", socket, runtimeInfo);
    }
    function unregisterRuntime(socket, runtimeInfo)
    {
        rootRuntimeManager.emitReversed("unregisterRuntime", socket, runtimeInfo.id);
    }

    // rootManager server events
    rootServer.on(
        "setupServerRoutes",
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
                        registerRuntime(socket, runtimeInfo);
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
                        unregisterRuntime(socket, runtimeInfo);
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
            unregisterRuntime(socket, runtimeInfo);
        }
    );

    // rootManager events
    rootManager.on(
        "init",
        async () => {
        }
    );
    rootManager.on(
        "release",
        async () => {
        }
    );
    return rootRuntimeManager;
}

module.exports = {
    createRootRuntimeManager
}