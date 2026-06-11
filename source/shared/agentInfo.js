
const path = require("path");
const { spawnAgent } = require("../agent/spawn");
const { checkAgentId } = require("./agentId");
const { makeSchemaFinalizer, makeFinalizeSchemaFunction } = require("../utilities/schema");

const agentInfoSchema = {
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
};
const makeAgentInfoFinalizer = () => makeSchemaFinalizer(agentInfoSchema);
const finalizeAgentInfo = makeFinalizeSchemaFunction(agentInfoSchema);

module.exports = {
    agentInfoSchema,
    makeAgentInfoFinalizer,
    finalizeAgentInfo,
}