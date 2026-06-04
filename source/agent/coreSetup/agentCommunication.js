const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { 
    makeAIMessage,
    makeHumanMessage,
    makeSystemMessage
} = require("../message");

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
        `${agent.config.root.url}/agent/send_messages`,
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

function coreSetupAgentCommunication(agent) {

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

            //         if (agent.config.closed_agent_connection_model)
            //         {
            //             if (
            //                 !(
            //                     (agent.getConnection(from))
            //                     || (from == "human")
            //                 )
            //             )
            //             {
            //                 return res.status(400).send(
            // `${agent.id} uses closed agent connection model but ${from} was not added to ${agent.id}'s agent connections. 
            // The only way for ${from} to correctly send messages to ${agent.id} is some how leveraging ${from}'s agent networks to tell ${agent.id} add connection to ${from}.`
            // );
            //             }
            //         }
                
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

    coreSetupAgentCommunicationTools(agent);
};

module.exports = {
    coreSetupAgentCommunication
}