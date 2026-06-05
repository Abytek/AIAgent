
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const chalk = require("chalk");
const { makeGameLoop } = require("../utilities/gameLoop");
const { loadAgentConfig } = require("./config");
const { createAgentLogger } = require("./logger");
const { loadAgentBrief } = require("./brief");
const { createAgentSubsystems } = require("./subsystems");
const { saveCommonStatus } = require("./commonStatus");

// the main function for users to create agents
function createAgent(options) {
    options = options || {};

    const spawnServiceInstanceInfo = JSON.parse(
        Buffer.from(process.argv[2], "base64").toString()
    );
    const agentDesc = spawnServiceInstanceInfo.args[0];

    const agent = makeGameLoop({
        path: options.path || process.cwd(),
        spawnServiceInstanceInfo,
        desc: agentDesc,
    });

    agent.config = loadAgentConfig(agent.path);
    agent.id = agentDesc.id;
    agent.tags = agentDesc.tags;
    agent.logger = createAgentLogger(agent);
    agent.brief = loadAgentBrief(agent);

    agent.dataDirectory = agentDesc.dataDirectory;
    fs.mkdirSync(agent.dataDirectory, { recursive: true });
    
    agent.on(
        "ready",
        async () => saveCommonStatus(agent)
    );

    createAgentSubsystems(agent);
    return agent;
}

module.exports = { createAgent };