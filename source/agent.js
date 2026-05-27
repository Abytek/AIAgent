const fs = require("fs");
const path = require("path");
const deasync = require("deasync");
const { importTools } = require("./tool");
const { loadAgentConfig } = require("./agent_config");
const { createAgentLLMQueue } = require("./agent_llm_queue");
const { createAgentContext } = require("./agent_context");

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
    agent.id = agentPath;
    agent.path = agentPath;
    agent.config = loadAgentConfig(agent.path);
    agent.tools = new Object();
    agent.shouldShutdown = false;
    agent.llmQueue = createAgentLLMQueue(agent);
    agent.context = createAgentContext(agent);
    agent.run = function () {
        while (!agent.shouldShutdown) {
            let tickDone = false;

            (async () => {
                await agent.llmQueue.flush();
                tickDone = true;
            })();

            while (!tickDone)
            {
                deasync.runLoopOnce();
            }
            deasync.runLoopOnce();
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
        agent.llmQueue.push(message);
    }

    // Load tools
    {
        importTools(agent, path.join(__dirname, "../tools"));
        importTools(agent, path.join(agentPath, "tools"));
    }

    agent.llmQueue.setup();
    return agent;
}

module.exports = { createAgent };