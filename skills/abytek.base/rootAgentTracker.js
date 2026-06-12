const { tool } = require("@langchain/core/tools");
const { z } = require("zod");

function importRootAgentTracker(skill) {

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
                                `${agent.rootURL}/agentTracker/list`
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
                        name: "rootAgentTracker_list",
                        description:
                            [
                                "Returns a list of all connected AI agents in your connected root.",
                            ].join("\n"),
                    }
                )
            );

            // has
            agent.tool(
                tool(
                    async ({ id }) =>
                    {
                        try
                        {
                            const response = await fetch(
                                `${agent.rootURL}/agentTracker/has/${encodeURIComponent(id)}`
                            );

                            if (!response.ok)
                            {
                                return `Failed to check agent status: ${response.status} ${response.statusText}`;
                            }

                            const exists = await response.json();

                            return exists
                                ? `Agent "${id}" is currently connected`
                                : `Agent "${id}" is currently offline or not connected to this root`;
                        }
                        catch (error)
                        {
                            return `Failed to check agent status: ${
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            }`;
                        }
                    },
                    {
                        name: "rootAgentTracker_has",
                        description:
                            "Checks whether an agent is currently connected to this root.",
                        schema: z.object({
                            id: z.string(),
                        }),
                    }
                )
            );

            // get
            agent.tool(
                tool(
                    async ({ id }) =>
                    {
                        try
                        {
                            const response = await fetch(
                                `${agent.rootURL}/agentTracker/get/${encodeURIComponent(id)}`
                            );

                            if (!response.ok)
                            {
                                return `Failed to get agent tracking data: ${response.status} ${await response.text()}`;
                            }

                            const trackingData = await response.json();

                            return [
                                `Tracking data for connected agent "${id}":`,
                                "",
                                JSON.stringify(trackingData, null, 4),
                            ].join("\n");
                        }
                        catch (error)
                        {
                            return `Failed to get agent tracking data: ${
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            }`;
                        }
                    },
                    {
                        name: "rootAgentTracker_get",
                        description:
                            "Returns tracking information about a currently connected agent.",
                        schema: z.object({
                            id: z.string(),
                        }),
                    }
                )
            );
        }
    );
};

module.exports = {
    importRootAgentTracker
}