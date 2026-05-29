
const { createAgent, makeHumanMessage } = require("abytek-aiagent");

const agent = createAgent();
agent.message(
    makeHumanMessage("Tell another agent to shut down")
);
agent.run();
agent.close();