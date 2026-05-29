
const { createAgent } = require("abytek-aiagent");

const agent = createAgent();
agent.message({
    role: "user",
    content: "Hello my friend ^^"
});
agent.run();
agent.close();