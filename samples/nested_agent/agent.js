
const path = require("path");
const { createAgent, spawnAgent, doSync } = require("abytek-aiagent");

const agent = createAgent();
agent.message({
    role: "user",
    content: "Hello"
});

spawnAgent({
    path: path.resolve(__dirname, "child")
});

agent.run();