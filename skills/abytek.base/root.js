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
                        name: "get_default_root_url",
                        description:
                            [
                                "Get URL of the root that is managing you.",
                            ].join("\n"),
                    }
                )
            );
            agent.tool(
                tool(
                    async () => {
                        try
                        {
                            const response = await fetch(
                                `${agent.rootURL}/agentRegistry/list`
                            );

                            if (!response.ok)
                            {
                                return `Failed to query agent list: ${response.status} ${response.statusText}`;
                            }

                            const agents = await response.json();
                            return `Here is the list of currently connected agents (note that this list could be changed in the future so you MUST re-call "get_agent_list" for refreshing the agent list):\n${JSON.stringify(agents, null, 4)}`;
                        }
                        catch (error)
                        {
                            return `Failed to query agent list: ${
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            }`;
                        }
                    },
                    {
                        name: "agent_registry_get_list",
                        description:
                            [
                                "Returns a list of all registered AI agents (some agents may be offline).",
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