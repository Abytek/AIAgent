
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
    return skill;
}

module.exports = {
    makeSkill,
}