
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { agentTagSchema } = require("../shared/agentTag");
const { loadSkillConfig } = require("../shared/skillConfig");

function makeSkill(agent, reference)
{
    const skill = makeEventEmitter({
        agent,
        path: reference.path,
        ...loadSkillConfig(reference.path),
        subsystems: {},
    });
    return skill;
}

module.exports = {
    makeSkill,
}