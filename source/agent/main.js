const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const chalk = require("chalk");
const { doSync, runLoopOnce } = require("../utilities/sync");
const { loadAgentConfig } = require("./config");
const { loadAgentBrief } = require("./brief");
const { createAgentLogger } = require("./logger");
const { createAgentLLMQueue } = require("./llmQueue");
const { createAgentContext } = require("./context");
const { createAgentServer } = require("./server");
const { createAgentTracking } = require("./tracking");
const { coreSetup } = require("./coreSetup/main");
const { makeAgentMessageFinalizer, logMessageOnAgent } = require("./message");
const { makeAgentConnectionFinalizer } = require("./connection");

function calculateDefaultAgentId(agentPath, agentConfig)
{
    if (agentConfig.anonymous)
    {
        try
        {
            return doSync(async () => {
                const response = await fetch(`${agentConfig.root.url}/agent/generate_id`);
                const responseText = await response.text();
                if (!response.ok)
                {
                    throw new Error(responseText);
                }
                return `AIAgent@${responseText}`;
            });
        }
        catch (error)
        {
            const result = `AIAgent@${process.pid}`;
            console.log(`Cannot generate id from root, generate local-environment agent id using process id:`, result);
            return result;
        }
    }
    const hashCode = crypto
        .createHash("sha1")
        .update(path.normalize(agentPath))
        .digest("base64url")
        .slice(0, 10);
    return `AIAgent@Main-${hashCode}`;
}

const defaultAgentData = JSON.parse(process.env.ABYTEK_AIAGENT_DATA || "{}");

// the main function for users to create agents
function createAgent(options) {
    options = options || {};

    const agent = {};

    agent.path = options.path || defaultAgentData.path || process.cwd();
    agent.path = path.normalize(agent.path);

    agent.config = loadAgentConfig(agent.path);

    agent.id = options.id || defaultAgentData.id || calculateDefaultAgentId(agent.path, agent.config);
    
    agent.logger = createAgentLogger(agent);

    agent.brief = loadAgentBrief(agent);

    agent.connections = options.connections || defaultAgentData.connections || [];

    agent.tempDir = path.resolve(agent.path, ".abytek-aiagent");
    fs.mkdirSync(agent.tempDir, { recursive: true });

    agent.initialDate = Date.now();
    agent.currentDate = agent.initialDate;
    agent.getSeconds = function() {
        return (agent.currentDate - agent.initialDate) / 1000;
    }

    agent.shouldShutdown = false;
    agent.closed = false;

    agent.nextChildIndex = 0;
    agent.generateChildId = function()
    {
        const childIndex = agent.nextChildIndex;
        agent.nextChildIndex++;
        return `${agent.id}.${childIndex}`;
    }

    agent.tools = new Object();

    agent.closeCommands = [];

    agent.external = {};

    agent.llmQueue = createAgentLLMQueue(agent);
    agent.context = createAgentContext(agent);
    agent.server = createAgentServer(agent);
    agent.tracking = createAgentTracking(agent);

    agent.close = function () {
        if (agent.closed)
        {
            return;
        }
        for (let idx = agent.closeCommands.length - 1; idx >= 0; --idx)
        {
            const closeCommand = agent.closeCommands[idx];
            closeCommand();
        }
        agent.closed = true;
    }
    agent.run = function () {
        agent.started = true;
        agent.llmQueue.setup();
        while (!agent.shouldShutdown) {
            doSync(async () => {
                await agent.llmQueue.flush();
            });
            agent.currentDate = Date.now();
            runLoopOnce();
        }
    };
    agent.signalShutdown = function()
    {
        agent.shouldShutdown = true;
    }

    agent.getConnection = function(id)
    {
        for (const connection of agent.connections)
        {
            if (connection.id == id)
            {
                return connection;
            }
        }
        return null;
    }
    agent.bindConnection = function(inConnection)
    {
        const cachedConnection = { ...inConnection };

        const connectionFinalizer = makeAgentConnectionFinalizer();
        if (!connectionFinalizer(cachedConnection)) {
            throw new Error(connectionFinalizer.toErrorsText());
        }

        for (let connection of agent.connections)
        {
            if (connection.id == id)
            {
                connection = cachedConnection;
                return agent;
            }
        }
        agent.connections.push(cachedConnection);
        return agent;
    }
    agent.unbindConnection = function(id)
    {
        for (let idx = 0; idx < agent.connections.length; ++idx)
        {
            const connection = agent.connections[idx];
            if (agent.connections.splice(idx, 1))
            {
                return agent;
            }
        }
        throw new Error(`Not found connection with id ${id} in ${agent.id}`);
    }

    agent.tool = function(tool)
    {
        const toolName = tool.name;
        if (toolName in agent.tools)
        {
            throw new Error(`Already added tool "${toolName}" to agent "${agent.id}"`);
        }
        agent.tools[toolName] = tool;
        if (agent.config.debug)
        {
            agent.logger.log([ chalk.rgb(60, 200, 30)("Tool Management") ], `Added tool "${toolName}" to agent "${agent.id}"`);
        }
        return tool;
    };
    agent.message = function(message)
    {
        const cachedMessage = { ...message };

        const agentMessageFinalizer = makeAgentMessageFinalizer();
        if (!agentMessageFinalizer(cachedMessage)) {
            throw new Error(agentMessageFinalizer.toErrorsText());
        }

        logMessageOnAgent(agent, cachedMessage);
        agent.llmQueue.push(cachedMessage);
    }

    // Setup
    coreSetup(agent);
    return agent;
}

module.exports = { createAgent };