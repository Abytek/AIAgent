
const { createSkill } = require("abytek-aiagent");

const skill = createSkill({
    name: "Abytek.Agent"
});
skill.tag("Abytek.Agent")
    .depends("Abytek.Framework");
skill.run();