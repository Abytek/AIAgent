
const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { Server } = require("socket.io");
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { makeSync } = require("../utilities/sync");
const { setupFrontendForExpressApp } = require("../frontend/helper");

function createRootServer(rootManager)
{
    let rootServer = makeEventEmitter({
        rootManager,
    });

    // rootManager server events
    rootServer.on(
        "setup",
        async () => {
            rootServer.app.get("/", (req, res) => {
            });
            rootServer.app.post("/stop", (req, res) => {
                res.status(200).send("Stop rootManager...");
                rootManager.logger.log([ chalk.rgb(60, 200, 30)("Server") ], "Stop root manager...");
                rootManager.signalShutdown();
            });
        }
    );
    rootServer.on(
        "socketClient_connected",
        async (socket) => {
            rootManager.logger.log([ chalk.rgb(60, 200, 30)("Server") ], "Client connected:", socket.id);
        }
    );
    rootServer.on(
        "socketClient_disconnected",
        async (socket, reason) => {
            rootManager.logger.log([ chalk.rgb(60, 200, 30)("Server") ], "Client disconnected:", reason);
        }
    );

    // rootManager events
    rootManager.on(
        "init",
        async () => {
            rootServer.app = express();
            {
                let sync = makeSync();
                rootServer.server = http.createServer(rootServer.app);
                rootServer.app.use(express.json());
                rootServer.io = new Server(rootServer.server, {
                    cors: {
                        origin: "*"
                    }
                });

                setupFrontendForExpressApp(rootServer.app);
                await rootServer.emit("setup");
                    
                rootServer.io.on("connection", async (socket) => {
                    await rootServer.emit("socketClient_connected", socket);

                    socket.on("disconnect", async (reason) => {
                        await rootServer.emitReversed("socketClient_disconnected", socket, reason);
                    });
                });

                let error = null;
                rootServer.server.listen(rootManager.config.server.port, null, () =>
                {
                    const address = rootServer.server.address();
                    rootServer.url = `http://127.0.0.1:${address.port}`;
                    rootManager.config.server.port = address.port;
                    rootManager.logger.log([ chalk.rgb(60, 200, 30)("Server") ], `RootManager server is running at:`, address);
                    sync.stop();
                });
                rootServer.server.on("error", (err) =>
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
    rootManager.on(
        "release",
        async () => {
            await new Promise(
                (resolve) => {
                    rootServer.server.close(
                        () => {
                            rootManager.logger.log([ chalk.rgb(60, 200, 30)("Server") ], `Closed rootManager server.`);
                            resolve();
                        }
                    );
                }
            )
        }  
    );
    return rootServer;
}

module.exports = {
    createRootServer
};