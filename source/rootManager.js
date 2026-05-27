const express = require("express");
const http = require("http");
const path = require("path");
const os = require("os");
const deasync = require("deasync");


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
    rootManager.app.post("/agent/register", (req, res) =>
    {
        if (!req.body)
        {
            res.status(400).json({ error: `Requires request body` });
            return;
        }

        if (!("id" in req.body))
        {
            res.status(400).json({ error: `Requires "id" in request body` });
            return;
        }
        const agentId = req.body.id;
       
        if (rootManager.agents.has(agentId))
        {
            res.status(400).json({ error: `Cannot register agent, already registered an agent with id: ${agentId}` });
            return;
        }

        if (!("url" in req.body))
        {
            res.status(400).json({ error: `Requires "url" in request body` });
            return;
        }
        const agentURL = req.body.url;

        const agent = {
            id: agentId,
            url: agentURL
        };
        rootManager.agents.set(agentId, agent);
        console.log(`Registered agent:`, agent);
        res.status(200).json({ message: `Registered agent` });
    });
    rootManager.app.post("/agent/unregister", (req, res) =>
    {
        if (!req.body)
        {
            res.status(400).json({ error: `Requires request body` });
            return;
        }

        if (!("id" in req.body))
        {
            res.status(400).json({ error: `Requires "id" in request body` });
            return;
        }
        const agentId = req.body.id;
       
        if (!rootManager.agents.has(agentId))
        {
            res.status(400).json({ error: `Not found agent with id: ${agentId}` });
            return;
        }
        
        rootManager.agents.delete(agentId);
        console.log(`Unregistered agent:`, agentId);
        res.status(200).json({ message: `Unregistered agent` });
    });


    // =====================================
    // SERVER CONTROL
    // =====================================

    rootManager.isRunning = false;

    rootManager.stop = function(callback)
    {
        rootManager.server.close(() =>
        {
            rootManager.isRunning = false;

            console.log("[RootManager] server stopped.");

            if (typeof callback === "function")
            {
                callback();
            }
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