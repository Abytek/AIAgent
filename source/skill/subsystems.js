
const { createSkillServer } = require("./server");
const { createSkillTracking } = require("./tracking");

function createSkillSubsystems(skill)
{
    skill.subsystems.server = createSkillServer(skill);
    skill.subsystems.tracking = createSkillTracking(skill);
}

module.exports = {
    createSkillSubsystems
}