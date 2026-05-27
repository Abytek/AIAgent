
const { createAgent } = require("abytek-aiagent");

const agent = createAgent({
});
agent.message({
    role: "user",
    content: "my name is Hung"
});
agent.message({
    role: "user",
    content: "tell me my name"
});
agent.run();