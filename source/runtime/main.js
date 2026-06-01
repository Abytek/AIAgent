const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { doSync, runLoopOnce } = require("../utilities/sync");
const { loadRuntimeConfig } = require("./config");
const { createRuntimeLogger } = require("./logger");
const { createRuntimeSubsystems } = require("./subsystems");

// the main function for users to create runtimes
function createRuntime(options) {
    options = options || {};

    const runtime = makeEventEmitter();

    runtime.config = loadRuntimeConfig(runtime);
    runtime.logger = createRuntimeLogger(runtime);

    runtime.shouldShutdown = false;
    runtime.closed = false;
    
    runtime.subsystems = {};
    createRuntimeSubsystems(runtime);
    
    runtime.run = function () {
        runtime.emit("init");
        while (!runtime.shouldShutdown) {
            doSync(async () => {
            });
            runLoopOnce();
        }
        runtime.emitReversed("release");
    };
    runtime.signalShutdown = function()
    {
        runtime.shouldShutdown = true;
    }

    return runtime;
}

module.exports = { createRuntime };