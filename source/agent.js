const fs = require("fs");
const path = require("path");
const { doSync, runLoopOnce } = require("./sync");
const { importTools } = require("./tool");
const { loadAgentConfig } = require("./agent_config");
const { createAgentLLMQueue } = require("./agent_llm_queue");
const { createAgentContext } = require("./agent_context");
const { createAgentServer } = require("./agent_server");
const { createAgentTracking } = require("./agent_tracking");
const { addCoreSystemPrompt } = require("./agent_core_system_prompt");
const { makeAgentMessageValidator } = require("./agent_message");

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
    agent.id = `${agentPath}[${process.pid}]`;
    agent.path = agentPath;
    agent.config = loadAgentConfig(agent.path);
    agent.tools = new Object();
    agent.shouldShutdown = false;
    agent.llmQueue = createAgentLLMQueue(agent);
    agent.context = createAgentContext(agent);

    agent.run = function () {
        while (!agent.shouldShutdown) {
            doSync(async () => {
                await agent.llmQueue.flush();
                tickDone = true;
            });
            runLoopOnce();
        }

        agent.tracking.close();
        agent.server.close();
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
        importTools(agent, path.join(__dirname, "../tools"));
        importTools(agent, path.join(agentPath, "tools"));
    }

    agent.llmQueue.setup();
    return agent;
}

module.exports = { createAgent };