
const { createAgent, makeHumanMessage } = require("abytek-aiagent");

const agent = createAgent();
agent.message(
    makeHumanMessage({
        content: "Hello, try use powershell to list files"
    })
);
agent.run();
agent.close();