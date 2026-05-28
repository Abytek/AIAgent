
const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { makeSync } = require("./sync");
const { makeAgentMessageValidator } = require("./agent_message");
const { getFrontendPublicDirectory } = require("./frontend");

function setupAgentServerStaticPaths(agentServer)
{
    const agent = agentServer.agent;
    agentServer.app.use(express.static(getFrontendPublicDirectory()));
}
function setupAgentServerRoutes(agentServer)
{
    const agent = agentServer.agent;

    agentServer.app.get("/", (req, res) => {
        res.type("html").send(
            fs.readFileSync(path.join(getFrontendPublicDirectory(), "source/html/agent.html"))
        );
    });
    agentServer.app.post("/messages", (req, res) => {
        if (!req.body)
        {
            return res.status(400).send(`Require request body`);
        }

        if (!("messages" in req.body))
        {
            return res.status(400).send(`Require "messages" in  request body`);
        }
        const messages = req.body.messages;
    
        for (const message of messages)
        {
            try 
            {
                agent.message(message);
            }
            catch(err)
            {
                return res.status(400).send(err.message);
            }
        }
        return res.status(200).send(`Successfully sent messages`);
    });
}

function createAgentServer(agent)
{
    let agentServer = {};

    agentServer.agent = agent;

    agentServer.app = express();

    {
        let sync = makeSync();
        agentServer.server = http.createServer(agentServer.app);
        agentServer.app.use(express.json());

        setupAgentServerStaticPaths(agentServer);
        setupAgentServerRoutes(agentServer);

        let error = null;
        agentServer.server.listen(agent.config.server.port, null, () =>
        {
            console.log(`Agent server is running at:`, agentServer.server.address());
            sync.stop();
        });
        agentServer.server.on("error", (err) =>
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

    agentServer.close = function()
    {
        if (!agentServer.enabled)
        {
            return;
        }
        const sync = makeSync();
        agentServer.server.close(
            () => {
                console.log(`Closed agent server.`);
                sync.stop();
            }
        );
        sync.wait();
    }
    return agentServer;
}

module.exports = {
    createAgentServer
};