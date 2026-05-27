
const { createAgent } = require("abytek-aiagent");

const agent = createAgent({
});
agent.message({
    role: "user",
    content: "hello"
});
agent.run();