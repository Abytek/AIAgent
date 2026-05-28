
const path = require("path");
const { createAgent, spawnAgent, doSync } = require("abytek-aiagent");

const agent = createAgent();
agent.message({
    role: "user",
    content: "Hello, wait for the child agent, then collab with them to write sort program in python"
});

spawnAgent({
    path: path.resolve(__dirname, "child")
});

agent.run();