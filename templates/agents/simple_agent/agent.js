
const { createAgent, makeHumanMessage } = require("abytek-aiagent");

const agent = createAgent();
agent.message(
    makeHumanMessage("Hello, tell me about yourself")
);
agent.run();
agent.close();