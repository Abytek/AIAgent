
const { 
    makeAIMessage,
    makeHumanMessage,
    makeSystemMessage
} = require("./message");

async function sendMessageToAnotherAgent(agent, targetId, messageContent) {

    const parsedMessages = [
        makeAIMessage({ 
            content: `[FROM ${agent.id}]\n${messageContent}`,
            name: agent.id
        }),
        makeAIMessage({ 
            content: `[CRITICAL]\nAll communications with ${agent.id} MUST use tool to reply`,
            name: agent.id
        }),
    ];

    const response = await fetch(
        `${agent.config.rootManager.url}/agent/send_messages`,
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

module.exports = {
    sendMessageToAnotherAgent
}