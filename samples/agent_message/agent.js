
const { createAgent } = require("abytek-aiagent");

const agent = createAgent();
agent.message({
    role: "user",
    content: "Say something to a random agent"
});
agent.run();