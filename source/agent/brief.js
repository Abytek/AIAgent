const fs = require("fs");
const path = require("path");

function loadAgentBrief(agent) {
    const briefPath = path.join(agent.path, "brief.md");
    let brief = "";
    if (fs.existsSync(briefPath)) {
        brief = fs.readFileSync(briefPath, "utf-8");
    }
    console.log(`Loaded brief for ${agent.id}:\n${brief}`);
    return brief;
}

module.exports = {
  loadAgentBrief,
};