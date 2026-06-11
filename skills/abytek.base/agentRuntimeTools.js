const { tool } = require("@langchain/core/tools");
const { z } = require("zod");

function setupAgentRuntimeTools(agent) {
    agent.tool(
        tool(
            async () => {
                agent.signalShutdown();
                return `Shutting down ${agent.id}...`;
            },
            {
                name: "shutdown_self_agent",
                description: "Immediately terminate your own agent instance and stop all further processing, reasoning, message handling, and tool execution."
            }
        )
    );
    agent.tool(
        tool(
            async () => {
                return agent.generateChildId();
            },
            {
                name: "generate_child_agent_id",
                description: "Generate child AI agent id. You MUST you this tool for assigning child AI agent id before spawning child AI agents"
            }
        )
    );
    agent.tool(
        tool(
            async () => {
                return `${agent.id}'s process env: ${JSON.stringify(process.env, null, 4)}`;
            },
            {
                name: "self_agent_process_env",
                description: "Get your own runtime process env."
            }
        )
    );
}

module.exports = {
    setupAgentRuntimeTools
}