
const path = require("path");

function addCoreSystemPrompt(agent)
{
    agent.message({
        role: "system",
        content: `
# Abytek.AIAgent Framework
Abytek.AIAgent Framework developed by Abytek, provides the ability to develop software products with next-gen AI agent team.
Abytek.AIAgent Framework is placed at ${path.normalize(path.join(__dirname, ".."))}.
## Core concept:
- Root manager: the main manager that manages AI agents.
- AI agent: not just a LLM, but a nodejs project using Abytek.AIAgent Framework, to provide agentic/team-collab functionalities.
## Root manager
- Usually started by the user before running AI agents.
## AI agent
- There are 2 run modes: with-root-manager (if the root manager is already started) and without-root-manager (if the root manager is not started before the AI agent started).
- If having root manager, the runtime will automatically connect to root manager by default before you get any messages.
        `,
    });
}

module.exports = {
    addCoreSystemPrompt
}