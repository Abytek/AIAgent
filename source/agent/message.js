
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const ajv = new Ajv({
    useDefaults: true,
    allErrors: true,
});

addFormats(ajv);

const agentMessageSchema = {
    type: "object",

    properties: {
        role: {
            type: "string",

            enum: [
                "system",
                "user",
                "assistant",
                "tool",
            ],
        },

        content: {
            anyOf: [
                {
                    type: "string",
                },

                {
                    type: "array",

                    items: {
                        type: "object",

                        properties: {
                            type: {
                                type: "string",
                            },

                            text: {
                                type: "string",
                            },
                        },

                        required: [
                            "type",
                        ],

                        additionalProperties: true,
                    },
                },
            ],
        },

        name: {
            type: "string",
        },

        tool_call_id: {
            type: "string",
        },

        force: {
            type: "boolean",
            default: false
        },
    },

    required: [
    ],

    additionalProperties: true,
};

const makeAgentMessageValidator = () => {
    const result = ajv.compile(agentMessageSchema);
    result.toErrorsText = function()
    {
        return result.errors
        .map(err =>
        {
            if (err.keyword === "additionalProperties")
            {
                return `${err.instancePath || "/"} has unknown property "${err.params.additionalProperty}"`;
            }

            return `${err.instancePath || "/"} ${err.message}`;
        })
        .join("\n");
    }
    return result;
}

module.exports = {
    makeAgentMessageValidator
};