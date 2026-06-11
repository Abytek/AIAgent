
const { createAgentServer } = require("./server");
const { createAgentServiceRegistry } = require("./serviceRegistry");
const { createAgentTracking } = require("./tracking");
const { createAgentToolManager } = require("./toolManager");
const { createAgentLLMContext } = require("./llmContext");
const { createAgentLLMManager } = require("./llmManager");
const { createAgentSkillManager } = require("./skillManager");

function createAgentSubsystems(agent)
{
    agent.subsystems = {};
    agent.subsystems.server = createAgentServer(agent);
    agent.subsystems.serviceRegistry = createAgentServiceRegistry(agent);
    agent.subsystems.runtimeTracking = createAgentTracking(
        agent,
        "runtime",
        agent.runtimeURL
    );
    agent.subsystems.rootTracking = createAgentTracking(
        agent,
        "root",
        agent.rootURL
    );
    agent.subsystems.toolManager = createAgentToolManager(agent);
    agent.subsystems.llmContext = createAgentLLMContext(agent);
    agent.subsystems.llmManager = createAgentLLMManager(agent);
    agent.subsystems.skillManager = createAgentSkillManager(agent);
    agent.subsystems.llmManager.markConversationStarted();
}

module.exports = {
    createAgentSubsystems
}