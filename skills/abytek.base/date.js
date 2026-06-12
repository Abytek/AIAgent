const { tool } = require("@langchain/core/tools");
const { z } = require("zod");

function importDate(skill) {

    const agent = skill.agent;

    skill.on(
        "setup",
        async () => {
            agent.tool(
                tool(
                    async () => {
                        const date = new Date();
                        return JSON.stringify(
                            {
                                locale: date.toLocaleString(),
                                iso: date.toISOString(),
                            },
                            null,
                            4
                        );
                    },
                    {
                        name: "date_now",
                        description:
                            [
                                "Get current date.",
                            ].join("\n"),
                    }
                )
            );
        }
    );
};

module.exports = {
    importDate
}