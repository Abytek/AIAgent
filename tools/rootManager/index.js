const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { sendMessageToAnotherAgent } = require("../../source/agent_communication");

module.exports = agent => {
    agent.tool(
        tool(
            async () => {
                return `${agent.tracking.enabled.toString()}`;
            },
            {
                name: "rootManager.enabled",
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
                        `${agent.config.rootManager.url}/agent/list`
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
                name: "rootManager.agent_list",
                description: "Query agent list",
            }
        )
    );
    agent.tool(
        tool(
            async ({
                targetId,
                messageContent
            }) => {
                try
                {
                    return await sendMessageToAnotherAgent(
                        agent,
                        targetId,
                        messageContent
                    );
                }
                catch (error)
                {
                    return (
                        error instanceof Error
                            ? error.message
                            : String(error)
                    );
                }
            },
            {
                name: "rootManager.agent_message",
                description: "Send message to another agent",
                schema: z.object({
                    targetId: z
                        .string()
                        .describe("Target AI agent ID"),

                    messageContent: z
                        .string()
                        .describe("Message content to send"),
                }),
            }
        )
    );
};