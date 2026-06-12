const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { 
    makeAIMessage,
    makeHumanMessage,
    makeSystemMessage
} = require("../../source/shared/message");

const MAX_MESSAGE_CHARACTERS = 2000;

async function sendMessageToAnotherAgent(agent, targetId, messageContent) {

    const parsedMessages = [
        makeSystemMessage({ 
            content: `[FROM ${agent.id}]\n${messageContent}`,
            name: agent.id
        }),
        makeSystemMessage({ 
            content: `[CRITICAL]\nAll communications with ${agent.id} MUST use tool to reply`,
            name: agent.id
        }),
    ];

    const response = await fetch(
        `${agent.rootURL}/agent/send_messages`,
        {
            method: "POST",
            headers:
            {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: agent.id,
                target_id: targetId,
                messages: parsedMessages
            })
        }
    );

    const text = await response.text();

    if (!response.ok)
    {
        throw new Error(text);
    }

    return text;
}

function setupServer(skill) {

    const agent = skill.agent;

    skill.on(
        "setup",
        async () => {
            if (!agent.tags.includes("abytek.communication"))
            {
                return;
            }

            const server = agent.subsystems.server;
            server.on(
                "setup",
                async () => {
                    server.app.post(
                        "/send_messages",
                        async (req, res) => {
                            if (!req.body)
                            {
                                return res.status(400).send(`Require request body`);
                            }

                            if (!("from" in req.body))
                            {
                                return res.status(400).send(`Require "from" in request body`);
                            }
                            const from = req.body.from;

                            if (!("messages" in req.body))
                            {
                                return res.status(400).send(`Require "messages" in request body`);
                            }
                            const messages = req.body.messages;
                        
                            for (const message of messages)
                            {
                                try 
                                {
                                    agent.message(message);
                                }
                                catch(err)
                                {
                                    return res.status(400).send(err.message);
                                }
                            }
                            return res.status(200).send(`Successfully sent messages`);
                        }
                    );
                }
            );
        }
    );
}
function importCommunicationTools(skill) {

    const agent = skill.agent;

    skill.on(
        "setup",
        async () => {
            if (!agent.tags.includes("abytek.communication"))
            {
                return;
            }

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
                        name: "sendMessageToAgent",

                        description:
                            [
                                "[AGENT COMMUNICATION]",
                                `Send a message (limit: ${MAX_MESSAGE_CHARACTERS} characters) to another AI agent.`,
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
        }
    );
};

function importCommunication(skill) {

    const agent = skill.agent;

    setupServer(skill);
    skill.on(
        "setup",
        async () => {
            if (!agent.tags.includes("abytek.communication"))
            {
                return;
            }

            agent.message(
                makeSystemMessage({
                    content: `
# INTER-AGENT COMMUNICATION RULES

IMPORTANT:
You NEVER communicate with other agents directly in normal text output.

ALL inter-agent communication MUST happen through provided tools.

When you are waiting for other agent responses for too long, please SEND FOLLOWING MESSAGE TO THEM.

Do NOT:
- simulate another agent response
- pretend another agent replied
- hallucinate agent communication
- roleplay inter-agent messaging

Only tools are allowed to perform agent communication.`,
                })
            );
        }
    );
    importCommunicationTools(skill);
};

module.exports = {
    importCommunication
}