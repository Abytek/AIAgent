const express = require("express");
const http = require("http");
const path = require("path");
const os = require("os");
const deasync = require("deasync");
const { Server } = require("socket.io");


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

    rootManager.socketIO = new Server(rootManager.server, {
        cors: {
            origin: "*"
        }
    });
    rootManager.socketToAgentId = new Map();


    // =====================================
    // ROUTES
    // =====================================

    rootManager.app.get("/", (req, res) =>
    {
        res.json({
            name: "RootManager",
            status: "running",
            agents: rootManager.agents.size,
            hostname: os.hostname(),
            uptime: process.uptime()
        });
    });
    rootManager.app.post("/stop", (req, res) =>
    {
        res.status(200);
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
                url: agentURL,
                socket: socket
            };
            rootManager.agents.set(agentId, agent);
            rootManager.socketToAgentId.set(socket, agentId);
            
            console.log(`Registered agent:`, agentId);

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
            
            rootManager.agents.delete(agentId);
            rootManager.socketToAgentId.delete(inSocket);
            console.log(`Unregistered agent:`, agentId);
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
        rootManager.server.close(() =>
        {
            rootManager.socketIO.close(() => {
                rootManager.isRunning = false;

                console.log("[RootManager] server stopped.");

                if (typeof callback === "function")
                {
                    callback();
                }
            })
        });
    };


    // BLOCKING RUN
    rootManager.run = function()
    {
        let started = false;
        let error = null;

        rootManager.server.listen(options.port, options.host, () =>
        {
            rootManager.isRunning = true;
            started = true;

            console.log(
                `[RootManager] running at http://${options.host}:${options.port}`
            );
        });

        rootManager.server.on("error", (err) =>
        {
            error = err;
            started = true;
        });

        // wait until server started
        deasync.loopWhile(() => !started);

        if (error != null)
        {
            throw error;
        }

        // BLOCK THREAD HERE
        // until server closes
        deasync.loopWhile(() => rootManager.isRunning);
    };

    return rootManager;
}

module.exports = {
    createRootManager
};