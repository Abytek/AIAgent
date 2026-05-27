
const { createAgent } = require("abytek-aiagent");

const agent = createAgent();
agent.message({
    role: "system",
    content: "Your name is simple_agent"
});
agent.message({
    role: "user",
    content: "Hello my agent, tell me your name"
});
agent.run();