
const chalk = require("chalk");

const Ajv = require("ajv"); 
const addFormats = require("ajv-formats");

const ajv = new Ajv({
    useDefaults: true,
    allErrors: true,
});

addFormats(ajv);

const agentConnectionSchema = {
    type: "object",

    properties: {
        id: {
            type: "string",
        },
        description: {
            type: "string",
        },
    },

    required: [
        "id",
    ],

    additionalProperties: true,
};

const makeAgentConnectionFinalizer = () => {
    const result = ajv.compile(agentConnectionSchema);
    result.toErrorsText = function()
    {
        return result.errors
        .map(err =>
        {
            if (err.keyword === "additionalProperties")
            {
                return `${err.instancePath || "/"} has unknown property "${err.params.additionalProperty}"`;
            }

            return `${err.instancePath || "/"} ${err.connection}`;
        })
        .join("\n");
    }
    return result;
}

module.exports = {
    makeAgentConnectionFinalizer
}