
const {
    AIMessage,
    HumanMessage,
    SystemMessage
} = require("@langchain/core/messages");

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
        }
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

function makeAIMessage(content)
{
    let result = new AIMessage({
        content: content || ""
    });
    result.setContent = function(value)
    {
        result.content = value;
        return result;
    }
    result.setName = function(value)
    {
        result.name = value;
        return result;
    }
    return result;
}
function makeHumanMessage(content)
{
    let result = new AIMessage({
        content: content || ""
    });
    result.setContent = function(value)
    {
        result.content = value;
        return result;
    }
    result.setName = function(value)
    {
        result.name = value;
        return result;
    }
    return result;
}
function makeSystemMessage(content)
{
    let result = new SystemMessage({
        content: content || ""
    });
    result.setContent = function(value)
    {
        result.content = value;
        return result;
    }
    result.setName = function(value)
    {
        result.name = value;
        return result;
    }
    return result;
}

module.exports = {
    makeAgentMessageValidator,
    makeAIMessage,
    makeHumanMessage,
    makeSystemMessage
};