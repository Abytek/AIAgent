const { tool } = require("@langchain/core/tools");
const { z } = require("zod");

function importRuntime(skill) {

    const agent = skill.agent;

    skill.on(
        "setup",
        async () => {
            agent.tool(
                tool(
                    async () => {
                        return agent.runtimeURL;
                    },
                    {
                        name: "runtime_url",
                        description:
                            [
                                "Get URL of the runtime that is managing you.",
                            ].join("\n"),
                    }
                )
            );
        }
    );
};

module.exports = {
    importRuntime
}