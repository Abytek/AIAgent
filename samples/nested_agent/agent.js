
const path = require("path");
const { createAgent, spawnAgent } = require("abytek-aiagent");

const agent = createAgent();
agent.message({
    role: "user",
    content: "Hello, wait for your child agent message, then collab with them to write sort program in python"
});

spawnAgent({
    path: path.resolve(__dirname, "child")
});

agent.run();
agent.close();