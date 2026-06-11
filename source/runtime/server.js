
const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { Server } = require("socket.io");
const chalk = require("chalk");
const { makeSync } = require("../utilities/sync");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { createGameLoopServer } = require("../utilities/gameLoopServer");
const { setupFrontendForExpressApp } = require("../frontend/helper");

function createRuntimeServer(runtime)
{
    let runtimeServer = createGameLoopServer({
        gameLoop: runtime,
        port: runtime.config.server.port,
    });
    runtimeServer.runtime = runtime;

    // runtime server events
    runtimeServer.on(
        "setup",
        async () => {
            setupFrontendForExpressApp(runtimeServer.app);
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
        "open",
        async () => {
            const address = runtimeServer.server.address();
            runtimeServer.url = `http://127.0.0.1:${address.port}`;
            runtime.config.server.port = address.port;
            runtime.logger.log([ chalk.rgb(60, 200, 30)("Server") ], `Runtime server is running at:`, address);
        }
    );
    runtimeServer.on(
        "close",
        async () => {
            runtime.logger.log([ chalk.rgb(60, 200, 30)("Server") ], `Closed runtime server.`);
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
    return runtimeServer;
}

module.exports = {
    createRuntimeServer
};