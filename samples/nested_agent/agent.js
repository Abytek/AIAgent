
const path = require("path");
const { createAgent, spawnAgent } = require("abytek-aiagent");

const agent = createAgent();
agent.message({
    role: "user",
    content: "Hello, wait for your managed agent message, then build a sort python program with him"
});

spawnAgent({
    path: path.resolve(__dirname, "child"),
    directManagerId: agent.id
});

agent.run();
agent.close();