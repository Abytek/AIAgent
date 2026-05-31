
const { createAgent, makeHumanMessage } = require("abytek-aiagent");

const agent = createAgent();
agent.message(
    makeHumanMessage({
        content: "Hello, try to create a python file in your own directory"
    })
);
agent.run();
agent.close();