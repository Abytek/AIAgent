
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { makeSkill } = require("./skill");

function createAgentSkillManager(agent)
{
    const agentSkillManager = makeEventEmitter({
        agent,
        skills: new Map(),
    });
    agentSkillManager.has = function(skillName)
    {
        return agentSkillManager.skills.has(skillName);
    }
    agentSkillManager.find = function(skillName)
    {
        if (!agentSkillManager.has(skillName))
        {
            return null;
        }
        return agentSkillManager.skills.find(skillName);
    }
    agentSkillManager.get = function(skillName)
    {
        if (!agentSkillManager.has(skillName))
        {
            throw new Error(`Not found skill with name: ${skillName}`);
        }
        return agentSkillManager.skills.get(skillName);
    }

    function importSkills()
    {
        for (const skillReference of agent.skillReferences)
        {
            const skillImportFunction = require(path.resolve(skillReference.path, "skill.js"));
            const skill = makeSkill(agent, skillReference);
            skillImportFunction(skill);
            if (skill.name == null)
            {
                throw new Error(`Skill at ${skillReference.path} has name of null`);
            }
            if (agentSkillManager.has(skill.name))
            {
                throw new Error(`Already added skill with name: ${skill.name}`);
            }
            agentSkillManager.skills.set(skill.name, skill);
            agent.logger.log([ chalk.rgb(60, 200, 30)("Skill") ], `Imported skill: ${chalk.rgb(100, 150, 250)(skill.name)}`);
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