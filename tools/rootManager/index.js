const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { sendMessageToAnotherAgent } = require("../../source/agent/communication");

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

                description:
                    [
                        "[AGENT COMMUNICATION]",
                        "Send a message to another AI agent.",
                        "",
                        "Use this tool when:",
                        "- another agent is better suited for the task",
                        "- you need information from another agent",
                        "- you need another agent to perform a subtask",
                        "- you need to coordinate with another agent",
                        "",
                        "Do NOT use this tool:",
                        "- to respond directly to the user",
                        "- for final answers",
                        "- for general reasoning",
                        "",
                        "The targetId must be an existing connected agent ID.",
                        "The messageContent should contain a clear task or request.",
                        "",
                        "Examples:",
                        "- ask coding_agent to debug code",
                        "- ask memory_agent to retrieve memory",
                        "- ask planner_agent to create a plan"
                    ].join("\n"),

                schema: z.object({
                    targetId: z
                        .string()
                        .describe(
                            [
                                "Existing target AI agent ID.",
                                "Must be a valid connected agent.",
                                "Example: coding_agent"
                            ].join(" ")
                        ),

                    messageContent: z
                        .string()
                        .describe(
                            [
                                "Task or message to send to the target agent.",
                                "Be specific and concise.",
                                "Describe exactly what the target agent should do."
                            ].join(" ")
                        ),
                }),
            }
        )
    );
};