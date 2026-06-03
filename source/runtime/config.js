const fs = require("fs");
const path = require("path");

const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const { getDefaultRootURL } = require("../env/root");
const { getDefaultRuntimePort } = require("../env/runtime");

const ajv = new Ajv({
    useDefaults: true,
    allErrors: true,
});

addFormats(ajv);

const configSchema = {
    type: "object",

    properties: {
        server: {
            type: "object",

            properties: {
                port: {
                    type: "integer",
                    default: getDefaultRuntimePort(),
                }
            },

            required: [],

            additionalProperties: false,

            default: {},
        },

        root: {
            type: "object",

            properties: {
                url: {
                    type: "string",
                    default: getDefaultRootURL(),
                }
            },

            required: [],

            additionalProperties: false,

            default: {},
        },
    },

    required: [],

    additionalProperties: false,
};

const validateConfig = ajv.compile(configSchema);

function loadRuntimeConfig() {
    const configPath = path.join(__dirname, "../../runtime.json");

    let config = {};

    if (fs.existsSync(configPath)) {
        try {
            config = JSON.parse(
                fs.readFileSync(configPath, "utf-8")
            );
        } catch (err) {
            throw new Error(
                `Invalid JSON in runtime.json\n${err.message}`
            );
        }
    }

    const valid = validateConfig(config);

    if (!valid) {
        throw new Error(
            ajv.errorsText(validateConfig.errors, {
                separator: "\n",
            })
        );
    }

    console.log(`Loaded runtime config:`, config);
    return config;
}

module.exports = {
    loadRuntimeConfig,
};