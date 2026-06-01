
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

function createSkillServer(skill)
{
    let skillServer = makeEventEmitter({
        skill,
    });

    // skill server events
    skillServer.on(
        "setupServerRoutes",
        async () => {
            skillServer.app.get("/", (req, res) => {
            });
            skillServer.app.post("/stop", (req, res) => {
                res.status(200).send("Stop skill...");
                skill.logger.log([ chalk.rgb(60, 200, 30)("Server") ], "Stop skill...");
                skill.signalShutdown();
            });
            skillServer.app.get("/tags", (req, res) => {
                let tags = [];
                skill.tags.forEach(
                    value => tags.push(value)
                )
                res.status(200).json(tags);
            });
        }
    );
    skillServer.on(
        "socketClient_connected",
        async (socket) => {
            skill.logger.log([ chalk.rgb(60, 200, 30)("Server") ], "Client connected:", socket.id);
        }
    );
    skillServer.on(
        "socketClient_disconnected",
        async (socket, reason) => {
            skill.logger.log([ chalk.rgb(60, 200, 30)("Server") ], "Client disconnected:", reason);
        }
    );

    // skill events
    skill.on(
        "init",
        async () => {
            skillServer.app = express();
            {
                let sync = makeSync();
                skillServer.server = http.createServer(skillServer.app);
                skillServer.app.use(express.json());
                skillServer.io = new Server(skillServer.server, {
                    cors: {
                        origin: "*"
                    }
                });

                setupFrontendForExpressApp(skillServer.app);
                skillServer.emit("setupServerRoutes");
                    
                skillServer.io.on("connection", (socket) => {
                    skillServer.emit("socketClient_connected", socket);

                    socket.on("disconnect", (reason) => {
                        skillServer.emitReversed("socketClient_disconnected", socket, reason);
                    });
                });

                let error = null;
                skillServer.server.listen(skill.config.server.port, null, () =>
                {
                    const address = skillServer.server.address();
                    skillServer.url = `http://127.0.0.1:${address.port}`;
                    skill.config.server.port = address.port;
                    skill.logger.log([ chalk.rgb(60, 200, 30)("Server") ], `Skill server is running at:`, address);
                    sync.stop();
                });
                skillServer.server.on("error", (err) =>
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
    skill.on(
        "release",
        async () => {
            await new Promise(
                (resolve) => {
                    skillServer.server.close(
                        () => {
                            skill.logger.log([ chalk.rgb(60, 200, 30)("Server") ], `Closed skill server.`);
                            resolve();
                        }
                    );
                }
            )
        }  
    );
    return skillServer;
}

module.exports = {
    createSkillServer
};