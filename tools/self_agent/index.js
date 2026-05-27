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
                name: "self_agent.stop",
                description: "Stop your agent lifecycle",
            }
        )
    );
};