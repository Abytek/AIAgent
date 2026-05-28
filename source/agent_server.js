
const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { makeSync } = require("./sync");

const frontendPublicPath = path.resolve(__dirname, "../frontend/public");

function setupAgentServerStaticPaths(agentServer)
{
    const agent = agentServer.agent;
    agentServer.app.use(express.static(frontendPublicPath));
}
function setupAgentServerRoutes(agentServer)
{
    const agent = agentServer.agent;

    agentServer.app.get("/", (req, res) => {
        res.type("html").send(
            fs.readFileSync(path.join(frontendPublicPath, "source/html/agent.html"))
        );
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