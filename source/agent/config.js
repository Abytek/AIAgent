const fs = require("fs");
const path = require("path");

const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const { getDefaultRootURL } = require("../shared/env/root");
const { getDefaultRuntimeURL } = require("../shared/env/runtime");
const { } = require("../shared/env/agent");

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

        root: {
            type: "object",

            properties: {
                url: {
                    type: "string",
                    default: "http://localhost:33999",
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
                    default: "http://localhost:39999",
                }
            },

            required: [],

            additionalProperties: false,

            default: {},
        },

        debug: {
            type: "boolean",
            default: false,
        },

        model: {
            type: "string",
            default: "default",
        },

        maxChatDurationInSeconds: {
            type: "number",
            default: 20,
        },

        provider: {
            type: "object",

            properties: {
                apiKey: {
                    type: "string",
                    default: "",
                },

                baseURL: {
                    type: "string",
                    default: "http://localhost:20128/v1",
                },
            },

            required: [],

            additionalProperties: false,

            default: {},
        },
    },

    additionalProperties: false,
};

const validateConfig = ajv.compile(configSchema);

function loadAgentConfig(agentPath) {
    const configPath = path.join(agentPath, "config.json");

    let config = {};

    if (fs.existsSync(configPath)) {
        try {
            config = JSON.parse(
            fs.readFileSync(configPath, "utf-8")
        );
    } catch (err) {
            throw new Error(
                `Invalid JSON in ${configPath}: ${err.message}`
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

    console.log(`Loaded config for ${agentPath}:`, config);
    return config;
}

module.exports = {
  loadAgentConfig,
};