
const path = require("path");
const { createAgent } = require("abytek-aiagent");

const agent = createAgent();
agent.message({
    role: "user",
    content: `Your parent agent is located at "${path.resolve(__dirname, "..")}", you MUST connect to your parent`
});
agent.run();