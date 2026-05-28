
const { createAgent } = require("abytek-aiagent");

const agent = createAgent();
agent.message({
    role: "user",
    content: "Tell another agent to shut down"
});
agent.run();
agent.close();