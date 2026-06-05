
const path = require("path");
const { createAgent, makeHumanMessage } = require("abytek-aiagent");

const agent = createAgent();
agent.message(
    makeHumanMessage({
        content: `Hello, I want to make a team of 4 child AI agents using the agent template ${path.resolve(__dirname, "../simple_agent")}. You are the leader, lead them to write a sort python program at ${path.resolve(__dirname, "../simple_agent")}/sort.py`
    })
);
agent.run();
agent.close();