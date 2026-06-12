const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { 
    makeAIMessage,
    makeHumanMessage,
    makeSystemMessage
} = require("../../source/shared/message");
const chalk = require("chalk");

function importAgentTag(skill)
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
                    async ({ runtimeId }) => {
                        let runtimeURL = null;
                        try
                        {
                            const response = await fetch(
                                `${agent.rootURL}/runtimeTracker/get/${encodeURIComponent(runtimeId)}`
                            );
                            if (!response.ok)
                            {
                                return `Failed to runtime url by id "${runtimeId}" before querying agent tags: ` + await response.text();
                            }
                            runtimeURL = (await response.json()).url;
                        }
                        catch(err)
                        {
                            return `Failed to runtime url by id "${runtimeId}" before querying agent tags: ` + err.message;
                        }

                        try
                        {
                            const response = await fetch(
                                `${runtimeURL}/skillRegistry/tags`
                            );
                            if (!response.ok)
                            {
                                return `Failed to query agent tags by id "${runtimeId}": ` + await response.text();
                            }
                            return await response.json();
                        }
                        catch(err)
                        {
                            return `Failed to query agent tags by id "${runtimeId}"` + err.message;
                        }
                    },
                    {
                        name: "get_agent_tags_by_runtime_id",

                        description:
                            [
                                "Get agent tags provided by a runtime by runtime id.",
                                "This tool is typically used for querying agent tags before registering/updating agent infos."
                            ].join("\n"),

                        schema: z.object({
                            runtimeId: z
                                .string()
                                .describe("The runtime id"),
                        }),
                    }
                )
            );
        }
    );
}

module.exports = {
    importAgentTag,
}