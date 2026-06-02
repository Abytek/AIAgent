
const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { Server } = require("socket.io");
const chalk = require("chalk");
const { makeSync } = require("../utilities/sync");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { setupFrontendForExpressApp } = require("../frontend/helper");

function createRuntimeServer(runtime)
{
    let runtimeServer = makeEventEmitter({
        runtime,
    });

    // runtime server events
    runtimeServer.on(
        "setup",
        async () => {
            runtimeServer.app.get("/", (req, res) => {
            });
            runtimeServer.app.post("/stop", (req, res) => {
                res.status(200).send("Stop runtime...");
                runtime.logger.log([ chalk.rgb(60, 200, 30)("Server") ], "Stop runtime...");
                runtime.signalShutdown();
            });
        }
    );
    runtimeServer.on(
        "socketClient_connected",
        async (socket) => {
            runtime.logger.log([ chalk.rgb(60, 200, 30)("Server") ], "Client connected:", socket.id);
        }
    );
    runtimeServer.on(
        "socketClient_disconnected",
        async (socket, reason) => {
            runtime.logger.log([ chalk.rgb(60, 200, 30)("Server") ], "Client disconnected:", reason);
        }
    );

    // runtime events
    runtime.on(
        "init",
        async () => {
            runtimeServer.app = express();
            {
                let sync = makeSync();
                runtimeServer.server = http.createServer(runtimeServer.app);
                runtimeServer.app.use(express.json());
                runtimeServer.io = new Server(runtimeServer.server, {
                    cors: {
                        origin: "*"
                    }
                });

                setupFrontendForExpressApp(runtimeServer.app);
                runtimeServer.emit("setup");
                    
                runtimeServer.io.on("connection", (socket) => {
                    runtimeServer.emit("socketClient_connected", socket);

                    socket.on("disconnect", (reason) => {
                        runtimeServer.emitReversed("socketClient_disconnected", socket, reason);
                    });
                });

                let error = null;
                runtimeServer.server.listen(runtime.config.server.port, null, () =>
                {
                    const address = runtimeServer.server.address();
                    runtimeServer.url = `http://127.0.0.1:${address.port}`;
                    runtime.config.server.port = address.port;
                    runtime.logger.log([ chalk.rgb(60, 200, 30)("Server") ], `Runtime server is running at:`, address);
                    sync.stop();
                });
                runtimeServer.server.on("error", (err) =>
                {
                    error = err;
                    sync.stop();
                });
                sync.wait();

                if (error)
                {
                    throw error;
                }
            }
        }
    )
    runtime.on(
        "release",
        async () => {
            await new Promise(
                (resolve) => {
                    runtimeServer.server.close(
                        () => {
                            runtime.logger.log([ chalk.rgb(60, 200, 30)("Server") ], `Closed runtime server.`);
                            resolve();
                        }
                    );
                }
            )
        }  
    );
    return runtimeServer;
}

module.exports = {
    createRuntimeServer
};