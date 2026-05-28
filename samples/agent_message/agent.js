
const { createAgent } = require("abytek-aiagent");

const agent = createAgent();
agent.message({
    role: "user",
    content: "I want you to collaborate with a random agent to solve a random programming problem with you"
});
agent.run();