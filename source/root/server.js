
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
const { renderView_rootDashboard } = require("../frontend/views/rootDashboard");

function createRootServer(root)
{
    let rootServer = createGameLoopServer({
        gameLoop: root,
    });
    rootServer.root = root;

    // root server events
    rootServer.on(
        "setup",
        async () => {
            setupFrontendForExpressApp(rootServer.app);
            rootServer.app.get("/", (req, res) => {
                renderView_rootDashboard(root, res);
            });
            rootServer.app.post("/stop", (req, res) => {
                res.status(200).send("Stop root...");
                root.logger.log([ chalk.rgb(60, 200, 30)("Server") ], "Stop root...");
                root.signalShutdown();
            });
        }
    );
    rootServer.on(
        "open",
        async () => {
            const address = rootServer.server.address();
            rootServer.url = `http://127.0.0.1:${address.port}`;
            root.config.server.port = address.port;
            root.logger.log([ chalk.rgb(60, 200, 30)("Server") ], `Root server is running at:`, address);
        }
    );
    rootServer.on(
        "close",
        async () => {
            root.logger.log([ chalk.rgb(60, 200, 30)("Server") ], `Closed root server.`);
        }
    );
    rootServer.on(
        "socketClient_connected",
        async (socket) => {
            root.logger.log([ chalk.rgb(60, 200, 30)("Server") ], "Client connected:", socket.id);
        }
    );
    rootServer.on(
        "socketClient_disconnected",
        async (socket, reason) => {
            root.logger.log([ chalk.rgb(60, 200, 30)("Server") ], "Client disconnected:", reason);
        }
    );
    return rootServer;
}

module.exports = {
    createRootServer
};