
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
            default: [ "abytek.default" ],
        },

        config: {
            type: "object",

            properties: {
                debug: {
                    type: "boolean",
                    default: false,
                },

                model: {
                    type: "string",
                    default: "default",
                },

                maxChatDurationInSeconds: {
                    type: "number",
                    default: 20,
                },

                memory: {
                    type: "object",

                    properties: {
                        lookbackMessages: {
                            type: "number",
                            default: 100,
                        },
                    },

                    default: {},
                },

                provider: {
                    type: "object",

                    properties: {
                        apiKey: {
                            type: "string",
                            default: "",
                        },

                        baseURL: {
                            type: "string",
                            default: "http://localhost:20128/v1",
                        },
                    },

                    required: [],

                    additionalProperties: false,

                    default: {},
                },
            },

            additionalProperties: false,
            default: {},
        }
    },

    required: [
        "id",
    ],
});

module.exports = {
    agentInfoSchema,
}