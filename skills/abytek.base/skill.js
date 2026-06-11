
const {} = require("abytek-aiagent");

module.exports = skill => {
    skill.setup({
        name: "abytek.base"
    });
    skill.on(
        "construct",
        async () => {
            skill.tag("abytek.base");
        }
    );
    skill.on(
        "setup",
        async () => {
        }
    );
}