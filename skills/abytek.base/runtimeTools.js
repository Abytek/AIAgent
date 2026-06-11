const { tool } = require("@langchain/core/tools");
const { z } = require("zod");

function importRuntimeTools(skill) {

    const agent = skill.agent;

    skill.on(
        "setup",
        async () => {
            agent.tool(
                tool(
                    async () => {
                        try
                        {
                            const response = await fetch(
                                `${agent.runtimeURL}/agentTracker/list`
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
                        name: "get_connected_agent_list",
                        description:
                            [
                                "Returns a list of all connected AI agents in your connected runtime.",
                            ].join("\n"),
                    }
                )
            );
        }
    );
};

module.exports = {
    importRuntimeTools
}