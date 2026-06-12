
const path = require("path");
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

module.exports = {
    agentTagSchema,
}