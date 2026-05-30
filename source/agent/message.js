
const {
    AIMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage
} = require("@langchain/core/messages");

const chalk = require("chalk");

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
        const RoleTagColor = [ 150, 0, 255 ];

        let tags = [];
        if (messageRole == "tool")
        {
            tags.push(chalk.rgb(...RoleTagColor)("Tool"));
        }
        else if (messageRole == "user")
        {
            tags.push(chalk.rgb(...RoleTagColor)("User"));
        }
        else if (messageRole == "system")
        {
            tags.push(chalk.rgb(...RoleTagColor)("System"));
        }
        else if (messageRole == "assistant")
        {
            tags.push(chalk.rgb(...RoleTagColor)("Assistant"));
        }
        else
        {
            throw new Error(`Unknown role: ${JSON.stringify(message, null, 4)}`);
        }

        if (message.name)
        {
            if (message.name != agent.id)
            {
                tags.push(message.name);
            }
        }

        const messageContent = getMessageContent(message);
        agent.logger.log(tags, messageContent);
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