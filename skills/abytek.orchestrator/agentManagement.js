const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { 
    makeAIMessage,
    makeHumanMessage,
    makeSystemMessage
} = require("../../source/shared/message");
const chalk = require("chalk");

function importAgentManagement(skill)
{
    const agent = skill.agent;

    skill.subsystems.agentManagement = {};

    skill.on(
        "setup",
        async () => {
            if (!agent.tags.includes("abytek.orchestrator"))
            {
                return;
            }

            agent.tool(
                tool(
                    async ({ targetAgentId, initialMessage }) => {
                        try
                        {
                            const response = await fetch(
                                `${agent.rootURL}/agentSpawnerManager/spawn`,
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        id: targetAgentId,
                                        "messages": [
                                            makeSystemMessage({ 
                                                content: `[FROM ${agent.id}]\n${initialMessage}`,
                                                name: agent.id
                                            }),
                                            makeSystemMessage({ 
                                                content: `[CRITICAL]\nAll communications with ${agent.id} MUST use tool to reply`,
                                                name: agent.id
                                            }),
                                        ]
                                    }),
                                }
                            );
                            if (!response.ok)
                            {
                                return `Failed to spawn agent ${targetAgentId}: ` + await response.text();
                            }
                            return `Spawned agent ${targetAgentId}: ` + await response.text();
                        }
                        catch(err)
                        {
                            return `Failed to spawn agent, error: ` + err.message;
                        }
                    },
                    {
                        name: "spawn_agent",

                        description:
                            [
                                "Spawn an agent by id",
                            ].join("\n"),

                        schema: z.object({
                            targetAgentId: z
                                .string()
                                .describe(
                                    [
                                        "The agent id to spawn."
                                    ].join(" ")
                                ),
                            initialMessage: z
                                .string()
                                .describe(
                                    [
                                        "The initial text message."
                                    ].join(" ")
                                ),
                        }),
                    }
                )
            );
            agent.tool(
                tool(
                    async ({ targetAgentId, initialMessage }) => {
                        try
                        {
                            const response = await fetch(
                                `${agent.rootURL}/agentSpawnerManager/kill`,
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        id: targetAgentId,
                                    }),
                                }
                            );
                            if (!response.ok)
                            {
                                return `Failed to kill agent ${targetAgentId}: ` + await response.text();
                            }
                            return `Killed agent ${targetAgentId}: ` + await response.text();
                        }
                        catch(err)
                        {
                            return `Failed to kill agent, error: ` + err.message;
                        }
                    },
                    {
                        name: "kill_agent",

                        description:
                            [
                                "Kill an agent by id",
                            ].join("\n"),

                        schema: z.object({
                            targetAgentId: z
                                .string()
                                .describe(
                                    [
                                        "The agent id to kill."
                                    ].join(" ")
                                ),
                        }),
                    }
                )
            );
            agent.tool(
                tool(
                    async ({ agentInfo }) => {
                        try
                        {
                            const response = await fetch(
                                `${agent.rootURL}/agentRegistry/set`,
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify(agentInfo),
                                }
                            );

                            if (!response.ok)
                            {
                                return `Failed to register agent: ` + await response.text();
                            }

                            return `Registered agent ${agentInfo.id}`;
                        }
                        catch(err)
                        {
                            return `Failed to register agent, error: ${err.message}`;
                        }
                    },
                    {
                        name: "register_agent",

                        description:
                            [
                                "Register a new agent into agent registry.",
                                "If agent already exists, it will be overwritten.",
                                "Note that this tool does not spawn the agent, just register its info before spawning.",
                                "If you want to a running agent, you MUST kill the agent, update it then re-spawning.",
                                "For agent tags, only registered tags (provided by the target runtime) are allowed",
                            ].join("\n"),

                        schema: z.object({
                            agentInfo: z.object({
                                id: z.string(),
                                runtimeId: z.string().optional(),
                                brief: z.string().optional(),
                                tags: z.array(z.string()).optional(),
                                config: z.any().optional(),
                            }),
                        }),
                    }
                )
            );
            agent.tool(
                tool(
                    async ({ targetAgentId }) => {
                        try
                        {
                            const response = await fetch(
                                `${agent.rootURL}/agentRegistry/unset/${encodeURIComponent(targetAgentId)}`,
                                {
                                    method: "POST",
                                }
                            );

                            if (!response.ok)
                            {
                                return `Failed to remove agent ${targetAgentId}: ` + await response.text();
                            }

                            return `Removed agent ${targetAgentId}`;
                        }
                        catch(err)
                        {
                            return `Failed to remove agent, error: ${err.message}`;
                        }
                    },
                    {
                        name: "remove_agent",

                        description:
                            [
                                "Remove an agent from registry.",
                                "Cannot remove running agents."
                            ].join("\n"),

                        schema: z.object({
                            targetAgentId: z
                                .string()
                                .describe("The agent id to remove."),
                        }),
                    }
                )
            );
        }
    );
}

module.exports = {
    importAgentManagement,
}