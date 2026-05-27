const { tool } = require("@langchain/core/tools");

module.exports = function (agent) {
    agent.tool(
        tool(
            async () => {
                console.log("test");

                return "logged test";
            },
            {
                name: "test_tool",
                description: "Log test message",
            }
        )
    );
};