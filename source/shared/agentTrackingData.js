
const path = require("path");
const { spawnAgent } = require("../agent/spawn");
const { checkAgentId } = require("./agentId");
const { makeSchemaFinalizer, makeFinalizeSchemaFunction } = require("../utilities/schema");


const agentTrackingDataSchema = {
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
};
const makeAgentTrackingDataFinalizer = () => makeSchemaFinalizer(agentTrackingDataSchema);
const finalizeAgentTrackingData = makeFinalizeSchemaFunction(agentTrackingDataSchema);

module.exports = {
    agentTrackingDataSchema,
    makeAgentTrackingDataFinalizer,
    finalizeAgentTrackingData,
}