
async function sendMessageToAnotherAgent(agent, targetId, messageContent) {

    const parsedMessages = [
        {
            role: "user",
            content: `# FROM ${agent.id}:\n${messageContent}`,
        },
        {
            role: "system",
            content: `CRITICAL: All communications with ${agent.id} MUST use tool to reply`,
            force: true
        },
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