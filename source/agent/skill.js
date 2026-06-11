
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");

function makeSkill(agent, reference)
{
    const skill = makeEventEmitter({
        agent,
        path: reference.path,
    });
    return skill;
}

module.exports = {
    makeSkill,
}