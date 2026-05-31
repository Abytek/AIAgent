
const { createAgent, makeHumanMessage } = require("abytek-aiagent");

const agent = createAgent();
agent.message(
    makeHumanMessage({
        content: "Hello, tell me about yourself"
    })
);
agent.run();
agent.close();