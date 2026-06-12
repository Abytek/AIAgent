const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { 
    makeAIMessage,
    makeHumanMessage,
    makeSystemMessage
} = require("../../source/shared/message");
const chalk = require("chalk");

function importRootAgentSpawnerManager(skill)
{
    const agent = skill.agent;

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
                        name: "rootAgentSpawnerManager.spawn",

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
                        name: "rootAgentSpawnerManager.kill",

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
        }
    );
}

module.exports = {
    importRootAgentSpawnerManager,
}