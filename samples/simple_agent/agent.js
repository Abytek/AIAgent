
const { createAgent } = require("abytek-aiagent");

const agent = createAgent();
agent.message({
    role: "user",
    content: process.argv[2] || "my name is Hung"
});
agent.run();