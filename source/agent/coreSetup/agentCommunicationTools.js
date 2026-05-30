const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { sendMessageToAnotherAgent } = require("../communication");

function coreSetupAgentCommunicationTools(agent) {
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
                name: "send_message_to_agent",

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

module.exports = {
    coreSetupAgentCommunicationTools
}