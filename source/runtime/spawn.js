const path = require("path");
const fs = require("fs");
const { simpleRun } = require("../utilities/simpleRun");
const { makeSync } = require("../utilities/sync");

async function spawnRuntime(options)
{
    if (!options)
    {
        throw new Error(`Requires options`);
    }

    if (!("path" in options))
    {
        throw new Error(`Requires "path" in options`);
    }

    let args = [];
    if ("args" in options)
    {
        args = options.args;
    }

    const runtimeInstallationExitCode = await simpleRun(
        "npm",
        [
            "install"
        ],
        {
            NODE_PATH: path.join(__dirname, "../../module_trick")
        },
        options.path
    );
    if (runtimeInstallationExitCode != 0)
    {
        throw new Error(`Cannot install runtime, exit code: ` + runtimeInstallationExitCode);
    }
    
    const runtimeExecutionExitCode = await simpleRun(
        "npm",
        [
            "run",
            "runtime",
            ...args
        ],
        {
            NODE_PATH: path.join(__dirname, "../../module_trick"),
        },
        options.path
    );
    if (runtimeExecutionExitCode != 0)
    {
        throw new Error(`Cannot execute runtime, exit code: ` + runtimeExecutionExitCode);
    }
}

function spawnRuntimeSync(options)
{
    const sync = makeSync();
    spawnRuntime(options)
        .then(() => sync.stop())
        .catch(err => { throw err; });
    sync.wait();
}

module.exports = {
    spawnRuntime,
    spawnRuntimeSync
}