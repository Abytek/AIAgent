
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
                "human",
                "ai",
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

const makeAgentMessageFinalizer = () => {
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

function makeAIMessage(options)
{
    return new AIMessage(options);
}
function makeHumanMessage(options)
{
    return new HumanMessage(options);
}
function makeSystemMessage(options)
{
    return new SystemMessage(options);
}
function getMessageRole(msg) {
    if (msg instanceof SystemMessage) return "system";
    if (msg instanceof HumanMessage) return "human";
    if (msg instanceof AIMessage) return "ai";
    if (msg instanceof ToolMessage) return "tool";
    
    if ("id" in msg)
    {
        const id = msg.id;
        if (Array.isArray(id))
        {
            if (id.includes("SystemMessage")) return "system";
            if (id.includes("HumanMessage")) return "human";
            if (id.includes("AIMessage")) return "ai";
            if (id.includes("ToolMessage")) return "tool";
        }
    }
    
    if ("type" in msg)
    {
        const type = msg.type;
        if (type == "system") return "system";
        if (type == "human") return "human";
        if (type == "ai") return "ai";
        if (type == "tool") return "tool";
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

function getMessageName(message)
{
    let messageName = null;
    if ("name" in message)
    {
        messageName = message.name;
    }
    if ("kwargs" in message)
    {
        const kwargs = message.kwargs;
        if ("name" in kwargs)
        {
            messageName = kwargs.name;
        }
    }
    return messageName;
}

function logMessageOnAgent(agent, message)
{
    const messageRole = getMessageRole(message);
    const messageName = getMessageName(message);
    if (agent.config.debug || (messageRole != "system"))
    {
        const RoleTagColor = [ 150, 0, 255 ];

        let tags = [];
        if (messageRole == "tool")
        {
            tags.push(chalk.rgb(...RoleTagColor)("Tool"));
        }
        else if (messageRole == "human")
        {
            tags.push(chalk.rgb(...RoleTagColor)("Human"));
        }
        else if (messageRole == "system")
        {
            tags.push(chalk.rgb(...RoleTagColor)("System"));
        }
        else if (messageRole == "ai")
        {
            tags.push(chalk.rgb(...RoleTagColor)("AI"));
        }
        else
        {
            throw new Error(`Unknown role: ${JSON.stringify(message, null, 4)}`);
        }

        if (messageName)
        {
            if (messageName != agent.id)
            {
                tags.push(chalk.rgb(50, 150, 255)(messageName));
            }
        }

        const messageContent = getMessageContent(message);
        agent.logger.log(tags, messageContent);
    }
}

module.exports = {
    makeAgentMessageFinalizer,
    makeAIMessage,
    makeHumanMessage,
    makeSystemMessage,
    getMessageRole,
    getMessageContent,
    logMessageOnAgent
};