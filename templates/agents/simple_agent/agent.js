
const { createAgent, makeHumanMessage } = require("abytek-aiagent");

const agent = createAgent();
agent.message(
    makeHumanMessage("Hello, list agent connections")
);
agent.run();
agent.close();