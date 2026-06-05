
const path = require("path");
const { createAgent, spawnAgent, makeHumanMessage } = require("abytek-aiagent");

const agent = createAgent();

const childId = agent.generateChildId();
agent.bindConnection({
    id: childId,
    description: `
The managed agent that ${agent.id} manages
`
});

agent.message(
    makeHumanMessage({
        content: `Hello, here is your task:
1. Wait for your managed agent ${childId} message.
2. Collab with ${childId} to build a sort python program.
        `
    })
);

spawnAgent({
    path: path.resolve(__dirname, "child"),
    id: childId,
    connections: [
        {
            id: agent.id,
            description: `
The direct manager, ${childId} must do what they tell you to do
`
        }
    ]
});

agent.run();
agent.close();