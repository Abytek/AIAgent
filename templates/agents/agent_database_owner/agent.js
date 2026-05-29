
const path = require("path");
const { createAgent, makeSystemMessage, makeHumanMessage } = require("abytek-aiagent");

const agent = createAgent();
agent.message(
    makeSystemMessage(`
[IMPORTANT]
- Your AI agent templates are placed at ${path.resolve(__dirname, "agents")}.
- To spawn/run/execute an AI agent, you should use the command "abytek-aiagent-cli agent" at the agent template directory.
    `)
);
agent.run();
agent.close();