const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const chalk = require("chalk");
const { makeGameLoop } = require("../utilities/gameLoop");
const { loadRuntimeConfig } = require("./config");
const { createRuntimeLogger } = require("./logger");
const { createRuntimeSubsystems } = require("./subsystems");

// the main function for users to create runtimes
function createRuntime(options) {
    options = options || {};

    const runtime = makeGameLoop();

    runtime.config = loadRuntimeConfig(runtime);
    runtime.logger = createRuntimeLogger(runtime);

    runtime.subsystems = {};
    createRuntimeSubsystems(runtime);
    return runtime;
}

module.exports = { createRuntime };