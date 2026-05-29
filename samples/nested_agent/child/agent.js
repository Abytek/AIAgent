
const path = require("path");
const { createAgent } = require("abytek-aiagent");

const agent = createAgent();
agent.message({
    role: "user",
    content: `Say something to your direct manager`
});
agent.run();
agent.close();