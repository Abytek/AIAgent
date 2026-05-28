
const path = require("path");
const { createAgent } = require("abytek-aiagent");

const agent = createAgent();
agent.message({
    role: "user",
    content: `Your parent agent is located at "${path.resolve(__dirname, "..")}" and already connected to the root manager, you MUST say something to your parent`
});
agent.run();