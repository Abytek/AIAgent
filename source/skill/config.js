const fs = require("fs");
const path = require("path");

const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const { getDefaultRuntimeURL } = require("../shared/env/runtime");
const { } = require("../shared/env/skill");

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
                    default: 0,
                }
            },

            required: [],

            additionalProperties: false,

            default: {},
        },

        runtime: {
            type: "object",

            properties: {
                url: {
                    type: "string",
                    default: getDefaultRuntimeURL(),
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

function loadSkillConfig(skill) {
    const configPath = path.join(skill.path, "./config.json");

    let config = {};

    if (fs.existsSync(configPath)) {
        try {
            config = JSON.parse(
                fs.readFileSync(configPath, "utf-8")
            );
        } catch (err) {
            throw new Error(
                `Invalid JSON in config.json\n${err.message}`
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

    console.log(`Loaded skill config:`, config);
    return config;
}

module.exports = {
    loadSkillConfig,
};