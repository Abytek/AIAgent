
const path = require("path");
const { createAgent, makeHumanMessage } = require("abytek-aiagent");

const agent = createAgent();
agent.message(
    makeHumanMessage(`Say something to your direct manager`)
);
agent.run();
agent.close();