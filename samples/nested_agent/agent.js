
const path = require("path");
const { createAgent, spawnAgent } = require("abytek-aiagent");

const agent = createAgent();
agent.message({
    role: "user",
    content: "Hello"
});

(async () => {
    spawnAgent({
        path: path.resolve(__dirname, "child")
    })
})();

agent.run();