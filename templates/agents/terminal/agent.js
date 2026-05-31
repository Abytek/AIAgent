
const path = require("path");
const { createAgent, makeHumanMessage } = require("abytek-aiagent");

const agent = createAgent();
agent.message(
    makeHumanMessage({
        content: `Hello, try run the agent at path ${path.resolve(__dirname, "../simple_agent")}, then send a hello message to them`
    })
);
agent.run();
agent.close();