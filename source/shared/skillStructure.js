
const path = require("path");
const fs = require("fs");
const { agentTagSchema } = require("./agentTag");

function loadAgentTagsFromSkillDirectory(skillDirectory)
{
    let result = [];
    const tagsJSONFile = path.resolve(skillDirectory, "tags.json");
    if (fs.existsSync(tagsJSONFile))
    {
        const tags = JSON.parse(fs.readFileSync(tagsJSONFile, "utf8"));
        for (const tag of tags)
        {
            const finalizedTag = agentTagSchema.finalize(tag);
            result.push(finalizedTag);
        }
    }
    return result;
}

module.exports = {
    loadAgentTagsFromSkillDirectory,
}