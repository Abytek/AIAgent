const fs = require("fs");
const path = require("path");
const deasync = require("deasync");
const { importTools } = require("./tool");
const { loadAgentConfig } = require("./agent_config");
const { createAgentLLMQueue } = require("./agent_llm_queue");
const { createAgentContext } = require("./agent_context");

function registerAgent(agent) {
    let tickDone = false;

    (async () => {
        let stop = function()
        {
            tickDone = true;
        }

        try {
            const response = await fetch(agent.config.rootManager.url);
            console.log(`Found root manager at:`, agent.config.rootManager.url);
        }
        catch (error) {
            console.log(`Not found root manager`);
            return stop();
        }

        try {
            const response = await fetch(
                `${agent.config.rootManager.url}/agent/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        id: agent.id,
                        url: "dummy"
                    }),
                }
            );
            agent.registered = true;
            console.log(`Registered agent`);
        }
        catch (error) {
            console.log(`Cannot register agent:`, error);
            return stop();
        }

        return stop();
    })();

    while (!tickDone)
    {
        deasync.runLoopOnce();
    }
}
function unregisterAgent(agent) {
    let tickDone = false;

    (async () => {
        let stop = function()
        {
            tickDone = true;
        }

        if (!agent.registered)
        {
            return stop();
        }

        try {
            const response = await fetch(
                `${agent.config.rootManager.url}/agent/unregister`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        id: agent.id
                    }),
                }
            );
            agent.registered = true;
            console.log(`Unregistered agent`);
        }
        catch (error) {
            console.log(`Cannot unregister agent:`, error);
            return stop();
        }

        return stop();
    })();

    while (!tickDone)
    {
        deasync.runLoopOnce();
    }
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
    agent.id = agentPath;
    agent.path = agentPath;
    agent.config = loadAgentConfig(agent.path);
    agent.tools = new Object();
    agent.shouldShutdown = false;
    agent.llmQueue = createAgentLLMQueue(agent);
    agent.context = createAgentContext(agent);
    agent.registered = false;

    registerAgent(agent);

    const stopAgentProcess = () => {
        console.log("Received Ctrl+C");
        unregisterAgent(agent);
        process.exit(0);
    };
    process.on("SIGINT", stopAgentProcess);
    process.on("SIGTERM", stopAgentProcess);
    process.on("SIGBREAK", stopAgentProcess);
    process.on("SIGHUP", stopAgentProcess);
    process.on("exit", stopAgentProcess);
    process.on("uncaughtException", stopAgentProcess);
    process.on("unhandledRejection", stopAgentProcess);

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

        unregisterAgent(agent);
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