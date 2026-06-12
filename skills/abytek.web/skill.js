
const {} = require("abytek-aiagent");

const { importSearch } = require("./search");
const { importOpen } = require("./open");

module.exports = skill => {

    const agent = skill.agent;

    importSearch(skill);
    importOpen(skill);
}