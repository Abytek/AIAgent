
const {} = require("abytek-aiagent");

const { importAgentTag } = require("./agentTag");
const { importAgentManagement } = require("./agentManagement");

module.exports = skill => {

    const agent = skill.agent;

    importAgentTag(skill);
    importAgentManagement(skill);
}