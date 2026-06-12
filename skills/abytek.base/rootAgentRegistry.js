const { tool } = require("@langchain/core/tools");
const { z } = require("zod");

function importRootAgentRegistry(skill)
{
    const agent = skill.agent;

    skill.on(
        "setup",
        async () =>
        {
            // list
            agent.tool(
                tool(
                    async () =>
                    {
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

                            return [
                                "Here is the list of registered agents:",
                                JSON.stringify(agents, null, 4),
                            ].join("\n");
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
                        name: "rootAgentRegistry_list",
                        description:
                            "Returns all registered AI agents.",
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
                                `${agent.rootURL}/agentRegistry/has/${encodeURIComponent(id)}`
                            );

                            if (!response.ok)
                            {
                                return `Failed to check agent existence: ${response.status} ${response.statusText}`;
                            }

                            const exists = await response.json();

                            return exists
                                ? `Agent "${id}" exists in registry`
                                : `Agent "${id}" does not exist in registry`;
                        }
                        catch (error)
                        {
                            return `Failed to check agent existence: ${
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            }`;
                        }
                    },
                    {
                        name: "rootAgentRegistry_has",
                        description:
                            "Checks whether an agent exists in the registry.",
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
                                `${agent.rootURL}/agentRegistry/get/${encodeURIComponent(id)}`
                            );

                            if (!response.ok)
                            {
                                return `Failed to get agent info: ${response.status} ${await response.text()}`;
                            }

                            const agentInfo = await response.json();

                            return [
                                `Agent info for "${id}":`,
                                JSON.stringify(agentInfo, null, 4),
                            ].join("\n");
                        }
                        catch (error)
                        {
                            return `Failed to get agent info: ${
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            }`;
                        }
                    },
                    {
                        name: "rootAgentRegistry_get",
                        description:
                            "Returns detailed information about a registered agent.",
                        schema: z.object({
                            id: z.string(),
                        }),
                    }
                )
            );

            // set
            agent.tool(
                tool(
                    async ({ agentInfo }) =>
                    {
                        try
                        {
                            const response = await fetch(
                                `${agent.rootURL}/agentRegistry/set`,
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify(agentInfo),
                                }
                            );

                            const text = await response.text();

                            if (!response.ok)
                            {
                                return `Failed to register/update agent: ${text}`;
                            }

                            return `Agent registered/updated successfully`;
                        }
                        catch (error)
                        {
                            return `Failed to register/update agent: ${
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            }`;
                        }
                    },
                    {
                        name: "rootAgentRegistry_set",
                        description:
                            [
                                "Registers a new agent or updates an existing one.",
                                "The provided object is sent directly to the registry.",
                            ].join("\n"),
                        schema: z.object({
                            agentInfo: z.record(z.any()),
                        }),
                    }
                )
            );

            // unset
            agent.tool(
                tool(
                    async ({ id }) =>
                    {
                        try
                        {
                            const response = await fetch(
                                `${agent.rootURL}/agentRegistry/unset/${encodeURIComponent(id)}`,
                                {
                                    method: "POST",
                                }
                            );

                            const text = await response.text();

                            if (!response.ok)
                            {
                                return `Failed to remove agent: ${text}`;
                            }

                            return `Agent "${id}" removed successfully`;
                        }
                        catch (error)
                        {
                            return `Failed to remove agent: ${
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            }`;
                        }
                    },
                    {
                        name: "rootAgentRegistry_unset",
                        description:
                            "Removes an agent from the registry. The agent must not currently be running.",
                        schema: z.object({
                            id: z.string(),
                        }),
                    }
                )
            );
        }
    );
}

module.exports = {
    importRootAgentRegistry,
};