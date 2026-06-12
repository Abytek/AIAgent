
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const chalk = require("chalk");
const { makeGameLoop } = require("../utilities/gameLoop");
const { createAgentLogger } = require("./logger");
const { createAgentSubsystems } = require("./subsystems");
const { saveCommonStatus } = require("./commonStatus");

// the main function for users to create agents
function createAgent(options) {
    options = options || {};

    const spawnServiceInstanceInfo = JSON.parse(
        Buffer.from(process.argv[2], "base64").toString()
    );
    const agentDesc = spawnServiceInstanceInfo.args[0];
    console.log(agentDesc);

    const agent = makeGameLoop({
        path: options.path || process.cwd(),
        spawnServiceInstanceInfo,
        desc: agentDesc,
    });

    agent.id = agentDesc.id;
    agent.config = agentDesc.config;
    agent.logger = createAgentLogger(agent);
    agent.tags = agentDesc.tags;
    agent.brief = agentDesc.brief;
    agent.rootURL = agentDesc.rootURL;
    agent.runtimeURL = agentDesc.runtimeURL;
    agent.skillReferences = agentDesc.skillReferences;
    agent.logger.log([ chalk.rgb(60, 200, 30)("Brief") ], agent.brief);

    agent.dataDirectory = agentDesc.dataDirectory;
    fs.mkdirSync(agent.dataDirectory, { recursive: true });

    agent.sandboxDirectory = path.resolve(agent.dataDirectory, "sandbox");
    fs.mkdirSync(agent.sandboxDirectory, { recursive: true });
    
    agent.on(
        "ready",
        async () => saveCommonStatus(agent)
    );

    createAgentSubsystems(agent);
    return agent;
}

module.exports = { createAgent };