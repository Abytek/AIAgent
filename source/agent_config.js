const fs = require("fs");
const path = require("path");

const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const ajv = new Ajv({
  useDefaults: true,
  allErrors: true,
});

addFormats(ajv);

const configSchema = {
  type: "object",

  properties: {
    server_port: {
      type: "integer",
      default: 0,
    },

    root_manager_url: {
      type: "string",
      default: "http://localhost:39999",
    },

    debug: {
      type: "boolean",
      default: false,
    },

    model: {
      type: "string",
      default: "general-coding-small",
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

  console.log(`Loaded config for ${agentPath}:`, config);
  return config;
}

module.exports = {
  loadAgentConfig,
};