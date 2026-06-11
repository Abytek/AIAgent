
const {} = require("abytek-aiagent");

const { setupFramework } = require("./framework");
const { setupAgentIdentity } = require("./agentIdentity");

const { setupAgentRuntimeTools } = require("./agentRuntimeTools");
const { setupRootTools } = require("./rootTools");
const { setupAgentCommunication } = require("./agentCommunication");

const { setupTerminal } = require("./terminal");

module.exports = skill => {

    const agent = skill.agent;
    
    skill.setup({
        name: "abytek.base"
    });
    skill.on(
        "construct",
        async () => {
            skill.tag("abytek.minimal");
            skill.tag("abytek.default")
                .depends("abytek.minimal");
        }
    );
    skill.on(
        "setup",
        async () => {
            setupFramework(agent);
            setupAgentIdentity(agent);

            setupAgentRuntimeTools(agent);
            setupRootTools(agent);
            setupAgentCommunication(agent);
            
            setupTerminal(agent);
        }
    );
}