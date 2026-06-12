const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { 
    makeAIMessage,
    makeHumanMessage,
    makeSystemMessage,
    getMessageRole,
    getMessageContent,
} = require("abytek-aiagent");

function buildMemorySystemPrompt(agent)
{
    const memory = agent.subsystems.llmContext.memory;

    const MAX_LOOKBACK_MESSAGES = agent.config.memory.lookbackMessages;

    if (memory.length === 0)
    {
        return "No previous memories available.";
    }

    const sections = [];

    const collectedMessages = [];

    // newest session first
    for (let i = memory.length - 1; i >= 0; i--)
    {
        const context = memory[i];

        const messages = context.messages || [];

        // newest message first
        for (let j = messages.length - 1; j >= 0; j--)
        {
            collectedMessages.push({
                sessionDate: context.initialDate,
                message: messages[j],
            });

            if (
                collectedMessages.length
                >= MAX_LOOKBACK_MESSAGES
            )
            {
                break;
            }
        }

        if (
            collectedMessages.length
            >= MAX_LOOKBACK_MESSAGES
        )
        {
            break;
        }
    }

    collectedMessages.reverse();

    sections.push(
        `You have access to ${memory.length} previous conversation sessions.`
    );

    let lastSessionDate = null;

    for (const item of collectedMessages)
    {
        const { sessionDate, message } = item;

        if (sessionDate !== lastSessionDate)
        {
            sections.push("");
            sections.push(
                `=== Memory Session (${sessionDate}) ===`
            );

            lastSessionDate = sessionDate;
        }

        const role = getMessageRole(message);
        const content = getMessageContent(message);

        let textContent = "";

        if (typeof content === "string")
        {
            textContent = content;
        }
        else if (Array.isArray(content))
        {
            textContent = content
                .filter(
                    item =>
                        item
                        && item.type === "text"
                        && typeof item.text === "string"
                )
                .map(item => item.text)
                .join("\n");
        }

        if (!textContent.trim())
        {
            continue;
        }

        sections.push(
            `[${role}] ${textContent}`
        );
    }

    return sections.join("\n");
}

function importMemory(skill) {

    const agent = skill.agent;

    skill.on(
        "lateSetup",
        async () => {
            if (!agent.tags.includes("abytek.memory"))
            {
                return;
            }

            agent.message(
                makeSystemMessage({
                    content: buildMemorySystemPrompt(agent)
                })
            );
        }
    );
};

module.exports = {
    importMemory
}