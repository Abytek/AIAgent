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
                    async ({ runtimeURL, targetAgentId, initialMessage }) => {
                        try
                        {
                            const response = await fetch(
                                `${runtimeURL}/agentSpawner/spawn`,
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
                            runtimeURL: z
                                .string()
                                .describe(
                                    [
                                        "The runtime URL to spawn agent on, you should use default value if wanting to spawn agent on your current runtime."
                                    ].join(" ")
                                )
                                .default(agent.runtimeURL),
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
        }
    );
}

module.exports = {
    importAgentManagement,
}