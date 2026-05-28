
async function sendMessageToAnotherAgent(agent, targetId, messageContent) {
    const response = await fetch(
        `${agent.config.rootManager.url}/agent/message`,
        {
            method: "POST",
            headers:
            {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from_id: agent.id,
                target_id: targetId,
                message_content: messageContent
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