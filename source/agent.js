const fs = require("fs");
const path = require("path");
const deasync = require("deasync");
const { importTools } = require("./tool");
const { loadAgentConfig } = require("./agent_config");

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
    agent.run = function () {
        while (!agent.shouldShutdown) {
            deasync.runLoopOnce();
        }
    };
    agent.tool = function(tool)
    {
        const toolName = tool.name;
        if (toolName in agent.tools)
        {
            throw new Error(`Already added tool ${toolName} to agent ${agent.id}`);
        }
        agent.tools[toolName] = tool;
        return tool;
    };

    // Load tools
    {
        importTools(agent, path.join(__dirname, "../tools"));
        importTools(agent, path.join(agentPath, "tools"));
    }
    return agent;
}

module.exports = { createAgent };