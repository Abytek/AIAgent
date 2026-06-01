const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const chalk = require("chalk");
const { makeGameLoop } = require("../utilities/gameLoop");
const { loadRootManagerConfig } = require("./config");
const { createRootLogger } = require("./logger");
const { createRootManagerSubsystems } = require("./subsystems");

function createRootManagerId(config)
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
    return `RootManager@${idHash}`;
}

// the main function for users to create rootManagers
function createRootManager(options) {
    options = options || {};

    const rootManager = makeGameLoop();

    rootManager.config = loadRootManagerConfig(rootManager);
    rootManager.id = createRootManagerId(rootManager.config);
    rootManager.logger = createRootLogger(rootManager);

    rootManager.subsystems = {};
    createRootManagerSubsystems(rootManager);
    return rootManager;
}

module.exports = { createRootManager };