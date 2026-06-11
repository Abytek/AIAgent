
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

const makeSchemaFinalizer = (schema) => {
    const result = ajv.compile(schema);
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
const makeFinalizeSchemaFunction = (schema) => {
    return (value) => {
        const finalizer = makeSchemaFinalizer(schema);
        if (!finalizer(value)) {
            throw new Error(finalizer.toErrorsText());
        }
        return value;
    }
}

module.exports = {
    makeSchemaFinalizer,
    makeFinalizeSchemaFunction
}