
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");

function makeSkill(agent, reference)
{
    const skill = makeEventEmitter({
        agent,
        path: reference.path,
        name: null,
        dependencies: [],
        tags: new Map(),
        subsystems: {},
    });
    skill.setup = function(options)
    {
        options = options || {};

        if (options.name == null)
        {
            throw new Error(`Requires valid skill name`);
        }
        skill.name = options.name;

        return skill;
    }
    skill.depends = function(skillName)
    {
        skill.dependencies.push(skillName);
    }
    skill.tag = function(tagName)
    {
        const tag = {
            name: tagName,
            dependencies: [],
            brief: "",
        };
        tag.setBrief = function(brief)
        {
            tag.brief = brief;
            return tag;
        }
        tag.depends = function(...dependencies)
        {
            for (const dependency of dependencies)
            {
                if (tag.dependencies.includes(dependency))
                {
                    continue;
                }
                tag.dependencies.push(dependency);
            }
            return tag;
        }
        skill.tags.set(tagName, tag);
        return tag;
    }
    return skill;
}

module.exports = {
    makeSkill,
}