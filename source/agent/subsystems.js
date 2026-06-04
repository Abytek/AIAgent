
const { createAgentServer } = require("./server");
const { createAgentServiceRegistry } = require("./serviceRegistry");
const { createAgentTracking } = require("./tracking");
const { createAgentToolManager } = require("./toolManager");
const { createAgentLLMContext } = require("./llmContext");
const { createAgentLLMManager } = require("./llmManager");

function createAgentSubsystems(agent)
{
    agent.subsystems = {};
    agent.subsystems.server = createAgentServer(agent);
    agent.subsystems.serviceRegistry = createAgentServiceRegistry(agent);
    agent.subsystems.runtimeTracking = createAgentTracking(
        agent,
        "runtime",
        agent.config.runtime.url
    );
    agent.subsystems.rootTracking = createAgentTracking(
        agent,
        "root",
        agent.config.root.url
    );
    agent.subsystems.toolManager = createAgentToolManager(agent);
    agent.subsystems.llmContext = createAgentLLMContext(agent);
    agent.subsystems.llmManager = createAgentLLMManager(agent);
}

module.exports = {
    createAgentSubsystems
}