
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");

function createAgentSkillManager(agent)
{
    const agentSkillManager = makeEventEmitter({
        agent,
    });
    return agentSkillManager;
}

module.exports = {
    createAgentSkillManager
};