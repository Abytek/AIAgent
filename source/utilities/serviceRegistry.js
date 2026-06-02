
const path = require("path");
const fs = require("fs");
const os = require("os");
const chalk = require("chalk");
const { makeEventEmitter } = require("./eventEmitter");

function createServiceRegistry(options)
{
    options = options || {};

    if (!("gameLoopServer" in options))
    {
        throw new Error(`Requires "gameLoopServer" in options`);
    }
    const gameLoopServer = options.gameLoopServer;
    const gameLoop = gameLoopServer.gameLoop;

    let serviceRegistry = makeEventEmitter({
        gameLoopServer,
        gameLoop,
    });

    //
    let isReady = false;
    let nextServiceIndex = 0;

    //
    serviceRegistry.generateServiceid = function(prefix = "")
    {
        const serviceIndex = nextServiceIndex;
        nextServiceIndex++;
        return `${prefix}${serviceIndex}`;
    }

    // gameLoop server events
    gameLoopServer.on(
        "setup",
        async () => {
            gameLoopServer.app.get("/serviceRegistry/ready", (req, res) => {
                res.status(200).json(isReady);
            });
            gameLoopServer.app.get("/serviceRegistry/generateServiceId/:prefix", (req, res) => {
                const { prefix } = req.params;
                res.status(200).send(serviceRegistry.generateServiceid(prefix));
            });
        }
    );
    gameLoopServer.on(
        "open",
        async () => {
        }
    );
    gameLoopServer.on(
        "close",
        async () => {
        }
    );
    gameLoopServer.on(
        "socketClient_connected",
        async (socket) => {
        }
    );
    gameLoopServer.on(
        "socketClient_disconnected",
        async (socket, reason) => {
        }
    );

    // 
    gameLoop.on(
        "ready", 
        () => {
            isReady = true;
        }
    );
    return serviceRegistry;
}

module.exports = {
    createServiceRegistry
};