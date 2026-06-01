const fs = require("fs");
const path = require("path");

const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const { getDefaultRootManagerPort } = require("../env/rootManager");

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
                    default: getDefaultRootManagerPort(),
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

function loadRootManagerConfig() {
    const configPath = path.join(__dirname, "../../rootManager.json");

    let config = {};

    if (fs.existsSync(configPath)) {
        try {
            config = JSON.parse(
                fs.readFileSync(configPath, "utf-8")
            );
        } catch (err) {
            throw new Error(
                `Invalid JSON in rootManager.json\n${err.message}`
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

    console.log(`Loaded rootManager config:`, config);
    return config;
}

module.exports = {
    loadRootManagerConfig,
};