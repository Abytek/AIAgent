
async function sendMessageToAnotherAgent(agent, targetId, messageContent) {

    const from = `AIAgent@${agent.id}`;

    const parsedMessages = [
        {
            role: "user",
            content: `# FROM ${from}:\n${messageContent}`
        },
        {
            role: "system",
            content: `If you want to reply ${from}, you MUST use rootManager.agent_message tool`,
            force: true
        }
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