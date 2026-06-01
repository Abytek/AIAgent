
const { createSkill } = require("abytek-aiagent");

const skill = createSkill({
    name: "Abytek.Agent"
});
skill.tag("Abytek.Agent")
    .use("Abytek.Framework");
skill.run();