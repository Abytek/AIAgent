
const {} = require("abytek-aiagent");

const { importAgentManagement } = require("./agentManagement");

module.exports = skill => {

    const agent = skill.agent;
    
    skill.setup({
        name: "abytek.orchestrator",
        dependencies: [
            "abytek.base"
        ]
    });
    skill.on(
        "construct",
        async () => {
            skill.tag("abytek.orchestrator")
                .depends("abytek.default");
        }
    );

    importAgentManagement(skill);
}