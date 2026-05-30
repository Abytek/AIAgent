
const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { makeSync } = require("../utilities/sync");
const { setupFrontendForExpressApp } = require("../frontend/helper");
const { renderView_agentMonitor } = require("../frontend/views/agentMonitor");

function setupAgentServerRoutes(agentServer)
{
    const agent = agentServer.agent;

    agentServer.app.get("/", (req, res) => {
        renderView_agentMonitor(agent, res);
    });
    agentServer.app.post("/send_messages", (req, res) => {
        if (!req.body)
        {
            return res.status(400).send(`Require request body`);
        }

        if (!("from" in req.body))
        {
            return res.status(400).send(`Require "from" in request body`);
        }
        const from = req.body.from;

        if (!("messages" in req.body))
        {
            return res.status(400).send(`Require "messages" in request body`);
        }
        const messages = req.body.messages;

        if (agent.config.closed_agent_connection_model)
        {
            if (
                !(
                    (from in agent.connections)
                    || (from == "human")
                )
            )
            {
                return res.status(400).send(
`${agent.id} uses closed agent connection model but ${from} was not added to ${agent.id}'s agent connections. 
The only way for ${from} to correctly send messages to ${agent.id} is some how leveraging ${from}'s agent networks to tell ${agent.id} add connection to ${from}.`
);
            }
        }
    
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

        setupFrontendForExpressApp(agentServer.app);
        setupAgentServerRoutes(agentServer);

        let error = null;
        agentServer.server.listen(agent.config.server.port, null, () =>
        {
            const address = agentServer.server.address();
            agentServer.url = `http://127.0.0.1:${address.port}`;
            agent.logger.log([], `Agent server is running at:`, address);
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
        const sync = makeSync();
        agentServer.server.close(
            () => {
                agent.logger.log([], `Closed agent server.`);
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