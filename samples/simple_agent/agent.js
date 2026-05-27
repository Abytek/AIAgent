
const { createAgent } = require("abytek-aiagent");

const agent = createAgent();
agent.message({
    role: "user",
    content: "Hello, forward message to your self but through the root manager"
});
agent.run();