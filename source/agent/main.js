const fs = require("fs");
const path = require("path");
const { doSync, runLoopOnce } = require("../utilities/sync");
const { importTools } = require("./tool");
const { loadAgentConfig } = require("./config");
const { loadAgentBrief } = require("./brief");
const { createAgentLogger } = require("./logger");
const { createAgentLLMQueue } = require("./llmQueue");
const { createAgentContext } = require("./context");
const { createAgentServer } = require("./server");
const { createAgentTracking } = require("./tracking");
const { addCoreSystemPrompt } = require("./coreSystemPrompt");
const { makeAgentMessageValidator, logMessageOnAgent } = require("./message");
const crypto = require("crypto");

function calculateAgentId(agentPath, agentConfig, processId)
{
    if (agentConfig.anonymous)
    {
        return `AIAgent@${processId}`;
    }
    const hashCode = crypto
        .createHash("sha1")
        .update(path.normalize(agentPath))
        .digest("base64url")
        .slice(0, 10);
    return `AIAgent@Main-${hashCode}`;
}

// the main function for users to create agents
function createAgent(Options) {
    if (Options == null) {
        Options = {};
    }
    let agentPath = Options.path;
    if (!agentPath) {
        agentPath = process.cwd();
    }
    agentPath = path.normalize(agentPath);

    const agent = new Object();
    agent.config = loadAgentConfig(agentPath);

    agent.path = agentPath;
    agent.id = calculateAgentId(agent.path, agent.config, process.pid);
    console.log(`Agent info:`, { id: agent.id, path: agent.path });

    agent.brief = loadAgentBrief(agent);

    agent.tempDir = path.resolve(agent.path, ".abytek-aiagent");
    fs.mkdirSync(agent.tempDir, { recursive: true });

    agent.directManagerId = Options.directManagerId || process.env.ABYTEK_AIAGENT_DIRECT_MANAGER_ID;

    agent.initialDate = Date.now();
    agent.currentDate = agent.initialDate;
    agent.getSeconds = function() {
        return (agent.currentDate - agent.initialDate) / 1000;
    }

    agent.logger = createAgentLogger(agent);

    agent.tools = new Object();
    agent.shouldShutdown = false;
    agent.llmQueue = createAgentLLMQueue(agent);
    agent.context = createAgentContext(agent);
    agent.closed = false;

    agent.close = function () {
        if (agent.closed)
        {
            return;
        }
        agent.tracking.close();
        agent.server.close();
        agent.closed = true;
    }
    agent.run = function () {
        agent.started = true;
        agent.llmQueue.setup();
        while (!agent.shouldShutdown) {
            doSync(async () => {
                await agent.llmQueue.flush();
                tickDone = true;
            });
            agent.currentDate = Date.now();
            runLoopOnce();
        }
    };
    agent.signalShutdown = function()
    {
        agent.shouldShutdown = true;
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
            console.log(`Added tool "${toolName}" to agent "${agent.id}"`);
        }
        return tool;
    };
    agent.message = function(message)
    {
        const agentMessageValidator = makeAgentMessageValidator();
        if (!agentMessageValidator(message)) {
            throw new Error(agentMessageValidator.toErrorsText());
        }

        logMessageOnAgent(agent, message);
        agent.llmQueue.push(message);
    }

    //
    agent.server = createAgentServer(agent);
    agent.tracking = createAgentTracking(agent);

    // System prompts
    {
        addCoreSystemPrompt(agent);
    }

    // Load tools
    {
        importTools(agent, path.join(__dirname, "../../tools"));
        importTools(agent, path.join(agentPath, "tools"));
    }
    return agent;
}

module.exports = { createAgent };