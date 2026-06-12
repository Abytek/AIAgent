const { tool } = require("@langchain/core/tools");
const { z } = require("zod");

function importRoot(skill) {

    const agent = skill.agent;

    skill.on(
        "setup",
        async () => {
            agent.tool(
                tool(
                    async () => {
                        return agent.rootURL;
                    },
                    {
                        name: "root_url",
                        description:
                            [
                                "Get URL of the root that is managing you.",
                            ].join("\n"),
                    }
                )
            );
        }
    );
};

module.exports = {
    importRoot
}