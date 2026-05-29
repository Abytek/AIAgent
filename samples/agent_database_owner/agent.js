
const path = require("path");
const { createAgent } = require("abytek-aiagent");

const agent = createAgent();
agent.message({
    role: "user",
    content: `You are an agent database owner, your main responsibilities is to manage AI agent sources at ${path.resolve(__dirname, "agents")}`
});
agent.run();
agent.close();