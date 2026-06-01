const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const chalk = require("chalk");
const { makeGameLoop } = require("../utilities/gameLoop");
const { loadRuntimeConfig } = require("./config");
const { createRuntimeLogger } = require("./logger");
const { createRuntimeSubsystems } = require("./subsystems");

function createRuntimeId(config)
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
    return `Runtime@${idHash}`;
}

// the main function for users to create runtimes
function createRuntime(options) {
    options = options || {};

    const runtime = makeGameLoop();

    runtime.config = loadRuntimeConfig(runtime);
    runtime.id = createRuntimeId(runtime.config);
    runtime.logger = createRuntimeLogger(runtime);

    runtime.subsystems = {};
    createRuntimeSubsystems(runtime);
    return runtime;
}

module.exports = { createRuntime };