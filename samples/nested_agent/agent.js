
const path = require("path");
const { createAgent, spawnAgent } = require("abytek-aiagent");

const agent = createAgent();
agent.message({
    role: "user",
    content: "Hello, wait for your managed agent message, then tell me his id"
});

spawnAgent({
    path: path.resolve(__dirname, "child"),
    directManagerId: agent.id
});

agent.run();
agent.close();