const { tool } = require("@langchain/core/tools");
const { z } = require("zod");

function coreSetupRootTools(agent) {
    agent.tool(
        tool(
            async () => {
                return `${agent.tracking.enabled.toString()}`;
            },
            {
                name: "root.enabled",
                description: "Check if you are running in managed mode",
            }
        )
    );
    agent.tool(
        tool(
            async () => {
                if (!agent.tracking.enabled)
                {
                    return "The AI agent is currently in standalone mode, cannot query agent list";
                }

                try
                {
                    const response = await fetch(
                        `${agent.config.root.url}/agent/list`
                    );

                    if (!response.ok)
                    {
                        return `Failed to query agent list: ${response.status} ${response.statusText}`;
                    }

                    const agents = await response.json();
                    return JSON.stringify(agents, null, 4);
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
                name: "get_agent_list",
                description:
                    [
                        "[AGENT MANAGEMENT]",
                        "Returns a list of all currently connected AI agents.",
                        "Use this tool when the user asks:",
                        "- what agents are available",
                        "- which agents exist",
                        "- connected agents",
                        "- active agents",
                        "- available workers",
                        "- list agents",
                        "This tool does not require any arguments."
                    ].join("\n"),
            }
        )
    );
};

module.exports = {
    coreSetupRootTools
}