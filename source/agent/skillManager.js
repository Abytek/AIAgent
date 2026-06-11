
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { makeSkill } = require("./skill");

function createAgentSkillManager(agent)
{
    const agentSkillManager = makeEventEmitter({
        agent,
    });

    function importSkills()
    {
        for (const skillReference of agent.skillReferences)
        {
            const skillImportFunction = require(path.resolve(skillReference.path, "skill.js"));
            const skill = makeSkill(agent, skillReference);
            skillImportFunction(skill);
        }
    }
    
    // agent events
    agent.on(
        "init",
        async () => {
            importSkills();
        }
    );
    return agentSkillManager;
}

module.exports = {
    createAgentSkillManager
};