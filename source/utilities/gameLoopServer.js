
const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { Server } = require("socket.io");
const chalk = require("chalk");
const { makeEventEmitter } = require("./eventEmitter");
const { makeSync } = require("./sync");

function createGameLoopServer(options)
{
    options = options || {};

    if (!("gameLoop" in options))
    {
        throw new Error(`Requires "gameLoop" in options`);
    }
    const gameLoop = options.gameLoop;

    const port = options.port || 0;

    let gameLoopServer = makeEventEmitter({
        gameLoop,
    });

    // gameLoop server events
    gameLoopServer.on(
        "setup",
        async () => {
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

    // gameLoop events
    gameLoop.on(
        "init",
        async () => {
            await new Promise(
                (resolve, reject) => {
                    gameLoopServer.app = express();
                    {
                        let sync = makeSync();
                        gameLoopServer.server = http.createServer(gameLoopServer.app);
                        gameLoopServer.app.use(express.json());
                        gameLoopServer.io = new Server(gameLoopServer.server, {
                            cors: {
                                origin: "*"
                            }
                        });

                        gameLoopServer.emit("setup");
                            
                        gameLoopServer.io.on("connection", (socket) => {
                            gameLoopServer.emit("socketClient_connected", socket);

                            socket.on("disconnect", (reason) => {
                                gameLoopServer.emitReversed("socketClient_disconnected", socket, reason);
                            });
                        });

                        let error = null;
                        gameLoopServer.server.listen(gameLoop.config.server.port, null, () =>
                        {
                            const address = gameLoopServer.server.address();
                            gameLoopServer.url = `http://127.0.0.1:${address.port}`;
                            gameLoopServer.emit("open");
                            resolve();
                        });
                        gameLoopServer.server.on("error", (err) =>
                        {
                            reject(err);
                        });
                    }
                }
            );
        }
    )
    gameLoop.on(
        "release",
        async () => {
            await new Promise(
                (resolve) => {
                    gameLoopServer.server.close(
                        () => {
                            gameLoopServer.emitReversed("close");
                            resolve();
                        }
                    );
                }
            )
        }  
    );
    return gameLoopServer;
}

module.exports = {
    createGameLoopServer
};