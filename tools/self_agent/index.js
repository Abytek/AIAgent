const { tool } = require("@langchain/core/tools");

module.exports = agent => {
    agent.tool(
        tool(
            async () => {
                console.log(`Agent calls "self_agent.stop" tool, shutting down...`);
                agent.signalShutdown();
                return ``;
            },
            {
                name: "shutdown_self_agent",
                description: "Immediately terminate your own agent instance and stop all further processing, reasoning, message handling, and tool execution. Use this when your task is fully completed, you are no longer needed, or continuing execution would waste resources."
            }
        )
    );
};