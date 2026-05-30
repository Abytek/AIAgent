const { tool } = require("@langchain/core/tools");
const { z } = require("zod");

function coreSetupAgentLifecycleTools(agent) {
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
}

module.exports = {
    coreSetupAgentLifecycleTools
}