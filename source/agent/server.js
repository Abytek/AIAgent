
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
const { renderView_agentMonitor } = require("../frontend/views/agentMonitor");

function createAgentServer(agent)
{
    let agentServer = createGameLoopServer({
        gameLoop: agent,
    });
    agentServer.agent = agent;

    // agent server events
    agentServer.on(
        "setup",
        async () => {
            setupFrontendForExpressApp(agentServer.app);
            agentServer.app.get("/", (req, res) => {
                renderView_agentMonitor(agent, res);
            });
            agentServer.app.post("/stop", (req, res) => {
                res.status(200).send("Stop agent...");
                agent.logger.log([ chalk.rgb(60, 200, 30)("Server") ], "Stop agent...");
                agent.signalShutdown();
            });
        }
    );
    agentServer.on(
        "open",
        async () => {
            const address = agentServer.server.address();
            agentServer.url = `http://127.0.0.1:${address.port}`;
            agent.config.server.port = address.port;
            agent.logger.log([ chalk.rgb(60, 200, 30)("Server") ], `Agent server is running at:`, address);
        }
    );
    agentServer.on(
        "close",
        async () => {
            agent.logger.log([ chalk.rgb(60, 200, 30)("Server") ], `Closed agent server.`);
        }
    );
    agentServer.on(
        "socketClient_connected",
        async (socket) => {
            agent.logger.log([ chalk.rgb(60, 200, 30)("Server") ], "Client connected:", socket.id);
        }
    );
    agentServer.on(
        "socketClient_disconnected",
        async (socket, reason) => {
            agent.logger.log([ chalk.rgb(60, 200, 30)("Server") ], "Client disconnected:", reason);
        }
    );
    return agentServer;
}

module.exports = {
    createAgentServer
};