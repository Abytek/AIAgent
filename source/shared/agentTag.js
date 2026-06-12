
const path = require("path");
const fs = require("fs");
const { spawnAgent } = require("../agent/spawn");
const { checkAgentId } = require("./agentId");
const { makeSchema } = require("../utilities/schema");

const agentTagSchema = makeSchema({
    type: "object",

    properties: {
        name: {
            type: "string",
        },
        
        brief: {
            type: "string",

            default: "",
        },
        
        dependencies: {
            type: "array",

            items: {
                type: "string",
            },

            default: [],
        },
    },

    required: [
        "name",
    ],
});

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
    agentTagSchema,
}