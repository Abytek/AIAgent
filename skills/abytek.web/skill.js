
const {} = require("abytek-aiagent");

const { importSearch } = require("./search");

module.exports = skill => {

    const agent = skill.agent;

    importSearch(skill);
}