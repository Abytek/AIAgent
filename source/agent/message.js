
const {
    AIMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage
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
    let result = new HumanMessage({
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
function getMessageRole(msg) {
    if (msg instanceof SystemMessage) return "system";
    if (msg instanceof HumanMessage) return "user";
    if (msg instanceof AIMessage) return "assistant";
    if (msg instanceof ToolMessage) return "tool";
    
    if ("id" in msg)
    {
        const id = msg.id;
        if (Array.isArray(id))
        {
            if (id.includes("SystemMessage")) return "system";
            if (id.includes("HumanMessage")) return "user";
            if (id.includes("AIMessage")) return "assistant";
            if (id.includes("ToolMessage")) return "tool";
        }
    }

    return msg.role;
}

function getMessageContent(message)
{
    let messageContent = "";
    if ("content" in message)
    {
        messageContent = message.content;
    }
    if ("kwargs" in message)
    {
        const kwargs = message.kwargs;
        if ("content" in kwargs)
        {
            messageContent = kwargs.content;
        }
    }
    return messageContent;
}

function logMessageOnAgent(agent, message)
{
    const messageRole = getMessageRole(message);
    if (agent.config.debug || (messageRole != "system"))
    {
        const NamePart = (
            message.name 
            ? (
                (message.name != agent.id)
                ? ` [${message.name}]`
                : ""
            ) 
            : ""
        );

        const messageContent = getMessageContent(message);

        if (messageRole == "tool")
        {
            agent.logger.log(`[Tool]${NamePart}\n`, messageContent);
        }
        else if (messageRole == "user")
        {
            agent.logger.log(`[User]${NamePart}\n`, messageContent);
        }
        else if (messageRole == "system")
        {
            agent.logger.log(`[System]${NamePart}\n`, messageContent);
        }
        else if (messageRole == "assistant")
        {
            agent.logger.log(`[Assistant]${NamePart}\n`, messageContent);
        }
        else
        {
            throw new Error(`Unknown role: ${JSON.stringify(message, null, 4)}`);
        }
    }
}

module.exports = {
    makeAgentMessageValidator,
    makeAIMessage,
    makeHumanMessage,
    makeSystemMessage,
    getMessageRole,
    logMessageOnAgent
};