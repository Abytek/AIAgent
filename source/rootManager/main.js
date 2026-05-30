const express = require("express");
const http = require("http");
const path = require("path");
const os = require("os");
const { Server } = require("socket.io");
const { loopWhile } = require("../utilities/sync");
const { setupFrontendForExpressApp } = require("../frontend/helper");
const { renderView_rootManagerDashboard } = require("../frontend/views/rootManagerDashboard");
const { getMessageRole, getMessageContent } = require("../agent/message");


// only the framework can execute this function to create the manager server that manages agents.
function createRootManager(options)
{
    if (options == null)
    {
        options = new Object();
    }

    options.host ??= "0.0.0.0";
    options.port ??= 39999;

    let rootManager = new Object();

    rootManager.path = path.join(__dirname, "..");

    rootManager.options = options;

    rootManager.app = express();
    rootManager.server = http.createServer(rootManager.app);

    rootManager.agents = new Map();

    rootManager.app.use(express.json());
    setupFrontendForExpressApp(rootManager.app);

    rootManager.socketIO = new Server(rootManager.server, {
        cors: {
            origin: "*"
        }
    });
    rootManager.socketToAgentId = new Map();
    rootManager.agentIdToSocket = new Map();


    // =====================================
    // ROUTES
    // =====================================

    rootManager.app.get("/", (req, res) =>
    {
        renderView_rootManagerDashboard(rootManager, res);
    });
    rootManager.app.post("/stop", (req, res) =>
    {
        res.status(200).send("Stop root manager...");
        rootManager.stop();
    });
    rootManager.app.get("/agent/list", (req, res) =>
    {
        let agents = [];
        rootManager.agents.forEach(
            value => agents.push(value)
        );
        res.status(200).json(agents);
    });
    rootManager.app.post("/agent/send_messages", async (req, res) =>
    {
        if (!req.body)
        {
            return res.status(400).send(`Require request body`);
        }

        if (!("from" in req.body))
        {
            return res.status(400).send(`Require "from" in request body`);
        }
        const from = req.body.from;

        if (!("target_id" in req.body))
        {
            return res.status(400).send(`Require "target_id" in request body`);
        }
        const targetId = req.body.target_id;
        if (!rootManager.agents.has(targetId))
        {
            return res.status(400).send(`Not found AI agent ${targetId}`);
        }
        const target = rootManager.agents.get(targetId);

        if (!("messages" in req.body))
        {
            return res.status(400).send(`Require "messages" in request body`);
        }
        const messages = req.body.messages;

        let messagesJoined = "";
        for (const message of messages)
        {
            messagesJoined += "\n";
            messagesJoined += `[${getMessageRole(message)}]: ${getMessageContent(message)}`;
        }
        console.log(
            `Forwarding messages to agent ${targetId}:`, 
            messagesJoined.substr(0, Math.min(300, messagesJoined.length)).toString()
        );

        try {
            const targetRes = await fetch(`${target.url}/send_messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: from,
                    messages,
                }),
            });

            const responseText = await targetRes.text();

            if (targetRes.ok) {
                res.status(200).send(
                    `Successfully sent message from ${from} to ${targetId}`
                );
            } else {
                res.status(400).send(responseText || "");
            }
        } catch (err) {
            res.status(500).send(err.message);
        }
    });

    rootManager.socketIO.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("register", (data, ack) => {
            if (!("id" in data))
            {
                if (ack)
                {
                    ack({ status: 400, message: `Requires "id" in data` });
                }
                return;
            }
            const agentId = data.id;
            if (rootManager.agents.has(agentId))
            {
                if (ack)
                {
                    ack({ status: 400, message: `Cannot register agent, already registered an agent with id: ${agentId}` });
                }
                return;
            }

            if (!("path" in data))
            {
                if (ack)
                {
                    ack({ status: 400, message: `Requires "path" in data` });
                }
                return;
            }
            const agentPath = data.path;

            if (!("config" in data))
            {
                if (ack)
                {
                    ack({ status: 400, message: `Requires "config" in data` });
                }
                return;
            }
            const agentConfig = data.config;

            if (!("brief" in data))
            {
                if (ack)
                {
                    ack({ status: 400, message: `Requires "brief" in data` });
                }
                return;
            }
            const agentBrief = data.brief;

            if (!("url" in data))
            {
                if (ack)
                {
                    ack({ status: 400, message: `Requires "url" in data` });
                }
                return;
            }
            const agentURL = data.url;

            const agent = {
                id: agentId,
                path: agentPath,
                config: agentConfig,
                brief: agentBrief,
                url: agentURL
            };
            rootManager.agents.set(agentId, agent);
            rootManager.socketToAgentId.set(socket, agentId);
            rootManager.agentIdToSocket.set(agentId, socket);
            
            console.log(`Registered agent:\n- Id: ${agent.id}\n- Path: ${agent.path}\n- Brief: ${agent.brief}`);

            if (ack)
            {
                ack({ status: 200, message: `Registered agent` });
            }
        });

        function unregisterAgent(inSocket, ack)
        {
            if (!(rootManager.socketToAgentId.has(inSocket)))
            {
                return;
            }

            const agentId = rootManager.socketToAgentId.get(inSocket);
            if (!rootManager.agents.has(agentId))
            {
                if (ack)
                {
                    ack({ status: 400, message: `Not found agent with id: ${agentId}` });
                }
                return;
            }

            const agent = rootManager.agents.get(agentId);
            
            rootManager.agents.delete(agentId);
            rootManager.socketToAgentId.delete(inSocket);
            rootManager.agentIdToSocket.delete(agentId);

            console.log(`Unregistered agent:\n- Id: ${agent.id}\n- Path: ${agent.path}\n- Brief: ${agent.brief}`);
        }
        socket.on("deregister", (ack) => {
            unregisterAgent(socket, ack);
        });
        socket.on("disconnect", (reason) => {
            unregisterAgent(socket);
            console.log("Disconnected:", reason);
        });
    });


    // =====================================
    // SERVER CONTROL
    // =====================================

    rootManager.isRunning = false;

    rootManager.stop = function(callback)
    {
        rootManager.socketIO.close(() => {
            rootManager.server.close(() =>
            {
                rootManager.isRunning = false;
                console.log("[RootManager] server stopped.");

                if (typeof callback === "function")
                {
                    callback();
                }
            });
        })
    };


    // BLOCKING RUN
    rootManager.run = function()
    {
        rootManager.server.listen(options.port, options.host, () =>
        {
            rootManager.isRunning = true;

            console.log(
                `[RootManager] running at http://${options.host}:${options.port}`
            );
        });

        rootManager.server.on("error", (err) =>
        {
            throw err;
        });
    };

    return rootManager;
}

module.exports = {
    createRootManager
};