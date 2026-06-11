
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
        sortedSkills: [],
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
    function sortSkills()
    {
        const visited = new Set();
        const visiting = new Set();
        const sorted = [];

        function visit(skill)
        {
            if (visited.has(skill.name))
            {
                return;
            }

            if (visiting.has(skill.name))
            {
                throw new Error(`Circular dependency detected at skill: ${skill.name}`);
            }

            visiting.add(skill.name);

            const dependencies = skill.dependencies || [];
            for (const dependencyName of dependencies)
            {
                const dependency = agentSkillManager.skills.get(dependencyName);

                if (dependency == null)
                {
                    throw new Error(
                        `Skill "${skill.name}" depends on missing skill "${dependencyName}"`
                    );
                }

                visit(dependency);
            }

            visiting.delete(skill.name);
            visited.add(skill.name);

            sorted.push(skill);
        }

        for (const skill of agentSkillManager.skills.values())
        {
            visit(skill);
        }

        agentSkillManager.sortedSkills = sorted;
    };
    
    // agent events
    agent.on(
        "init",
        async () => {
            importSkills();
            sortSkills();
            for (const skill of agentSkillManager.sortedSkills)
            {
                await skill.emit("init");
            }
        }
    );
    agent.on(
        "ready",
        async () => {
            for (const skill of agentSkillManager.sortedSkills)
            {
                await skill.emit("ready");
            }
        }
    );
    return agentSkillManager;
}

module.exports = {
    createAgentSkillManager
};