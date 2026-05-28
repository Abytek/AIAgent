
const { createAgent } = require("abytek-aiagent");

const agent = createAgent();
agent.message({
    role: "user",
    content: "Analyze the project at C:/Abytek/Abytek"
});
agent.run();