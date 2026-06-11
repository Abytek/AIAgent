
const path = require("path");
const { spawnAgent } = require("../agent/spawn");
const { checkAgentId } = require("./agentId");
const { makeSchema } = require("../utilities/schema");

const agentTrackingDataSchema = makeSchema({
    type: "object",

    properties: {
        id: {
            type: "string",
        },
        
        url: {
            type: "string",
        },
    },

    required: [
        "id",
        "url",
    ],
});

module.exports = {
    agentTrackingDataSchema,
}