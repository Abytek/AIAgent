const { tool } = require("@langchain/core/tools");

module.exports = agent => {
    agent.tool(
        tool(
            async () => {
                return `${agent.tracking.enabled.toString()}`;
            },
            {
                name: "rootManager.enabled",
                description: "Check if you are running in managed mode",
            }
        )
    );
};