
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

const makeSchema = (raw) => {
    const result = { raw, };
    result.makeFinalizer = () => {
        const finalizer = ajv.compile(raw);
        finalizer.toErrorsText = function()
        {
            return finalizer.errors
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
        return finalizer;
    }
    result.finalize = (value) => {
        const finalizer = result.makeFinalizer();
        if (!finalizer(value)) {
            throw new Error(finalizer.toErrorsText());
        }
        return value;
    };
    return result;
}

module.exports = {
    makeSchema,
}