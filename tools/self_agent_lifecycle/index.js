const { tool } = require("@langchain/core/tools");

module.exports = function stop_self_agent(agent) {
    agent.tool(
        tool(
            async () => {
                console.log(`Agent calls "stop_self_agent" tool, shutting down...`);
                return `"stop_self_agent" tool was successfully called, shutting down...`;
            },
            {
                name: "stop_self_agent",
                description: "Stop your agent lifecycle",
            }
        )
    );
};