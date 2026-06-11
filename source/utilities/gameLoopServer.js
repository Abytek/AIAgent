
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
            gameLoopServer.app = express();
            {
                gameLoopServer.server = http.createServer(gameLoopServer.app);
                gameLoopServer.app.use(express.json());
                gameLoopServer.io = new Server(gameLoopServer.server, {
                    cors: {
                        origin: "*"
                    }
                });

                await gameLoopServer.emit("setup");
                    
                gameLoopServer.io.on("connection", async (socket) => {
                    await gameLoopServer.emit("socketClient_connected", socket);

                    socket.on("disconnect", async (reason) => {
                        await gameLoopServer.emitReversed("socketClient_disconnected", socket, reason);
                    });
                });

                await new Promise(
                    (resolve, reject) => {
                        gameLoopServer.server.listen(port, null, async () =>
                        {
                            const address = gameLoopServer.server.address();
                            gameLoopServer.url = `http://127.0.0.1:${address.port}`;
                            await gameLoopServer.emit("open");
                            resolve();
                        });
                        gameLoopServer.server.on("error", (err) =>
                        {
                            reject(err);
                        });
                    }
                );
            }
        }
    )
    gameLoop.on(
        "release",
        async () => {
            await new Promise(
                (resolve, reject) => {
                    try
                    {
                        gameLoopServer.server.close(
                            () => {
                                gameLoopServer.emitReversed("close")
                                    .then(() => resolve())
                                    .catch(err => reject(err));
                            }
                        );
                    }
                    catch(err)
                    {
                        reject(err)
                    }
                }
            )
        }  
    );
    return gameLoopServer;
}

module.exports = {
    createGameLoopServer
};