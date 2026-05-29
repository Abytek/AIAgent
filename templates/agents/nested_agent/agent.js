
const path = require("path");
const { createAgent, spawnAgent, makeHumanMessage } = require("abytek-aiagent");

const agent = createAgent();
agent.message(
    makeHumanMessage(`Hello, here is your task:
1. Wait for your managed agent message.
2. Collab with him to build a sort python program.
    `)
);

spawnAgent({
    path: path.resolve(__dirname, "child"),
    directManagerId: agent.id
});

agent.run();
agent.close();