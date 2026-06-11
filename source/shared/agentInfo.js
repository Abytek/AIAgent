
const path = require("path");
const { spawnAgent } = require("../agent/spawn");
const { checkAgentId } = require("./agentId");
const { makeSchema } = require("../utilities/schema");

const agentInfoSchema = makeSchema({
    type: "object",

    properties: {
        id: {
            type: "string",
        },

        brief: {
            type: "string",
            default: "",
        },

        tags: {
            type: "array",
            items: {
                type: "string",
            },
            default: [],
        },
    },

    required: [
        "id",
    ],
});

module.exports = {
    agentInfoSchema,
}