
const path = require("path");
const fs = require("fs");
const { agentTagSchema } = require("./agentTag");
const { makeSchema } = require("../utilities/schema");

const skillConfigSchema = makeSchema({
    type: "object",

    properties: {
        name: {
            type: "string",
        },
        
        brief: {
            type: "string",
            default: "",
        },

        tags: {
            type: "array",
            items: agentTagSchema.raw,
            default: [],
        },

        dependencies: {
            type: "array",
            items: {
                type: "string",
            },
            default: [],
        }
    },

    required: [
        "name",
    ],
});

function loadSkillConfig(skillDirectory)
{
    const file = path.resolve(skillDirectory, "config.json");
    if (!fs.existsSync(file))
    {
        throw new Error(`Not found skill config at ${file}`);
    }
    let result = JSON.parse(fs.readFileSync(file, "utf8"));
    result = skillConfigSchema.finalize(result);
    return result;
}

module.exports = {
    skillConfigSchema,
    loadSkillConfig,
}