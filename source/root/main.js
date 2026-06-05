const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const chalk = require("chalk");
const { makeGameLoop } = require("../utilities/gameLoop");
const { loadRootConfig } = require("./config");
const { createRootLogger } = require("./logger");
const { createRootSubsystems } = require("./subsystems");

function createRootId(config)
{
    const interfaces = os.networkInterfaces();

    const identities = [];

    for (const iface of Object.values(interfaces)) {
        for (const address of iface || []) {
            if (address.internal) continue;

            // IPv4
            if (address.family === "IPv4") {
                identities.push(address.address);
            }
        }
    }

    identities.sort();

    const idHash =  crypto
        .createHash("sha256")
        .update(
            JSON.stringify({
                identities,
                port: config.server.port,
            })
        )
        .digest("base64url")
        .slice(0, 12);
    return `Root@${idHash}`;
}

// the main function for users to create roots
function createRoot(options) {
    options = options || {};

    const root = makeGameLoop({
        path: options.path || process.cwd(),
    });

    root.config = loadRootConfig(root);
    root.id = createRootId(root.config);
    root.logger = createRootLogger(root);
    
    root.dataDirectory = path.resolve(root.path, ".abytek-aiagent", root.id);
    fs.mkdirSync(root.dataDirectory, { recursive: true });

    root.subsystems = {};
    createRootSubsystems(root);
    return root;
}

module.exports = { createRoot };