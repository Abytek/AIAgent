const path = require("path");
const fs = require("fs");
const { simpleRun } = require("./simpleRun");
const { makeSync } = require("./sync");

async function spawnNodeJSProcess(options)
{
    if (!options)
    {
        throw new Error(`Requires options`);
    }

    if (!("path" in options))
    {
        throw new Error(`Requires "path" in options`);
    }
    if (!("script" in options))
    {
        throw new Error(`Requires "script" in options`);
    }

    let args = options.args || [];

    let usePackage_AbytekAIAgent = options.usePackage_AbytekAIAgent || true;

    let extraEnvInstallation = options.extraEnvInstallation || {};
    if (usePackage_AbytekAIAgent)
    {
        extraEnvInstallation = {
            ...extraEnvInstallation,
            NODE_PATH: path.join(__dirname, "../../module_trick"),
        }
    }

    let extraEnvExecution = options.extraEnvExecution || {};
    if (usePackage_AbytekAIAgent)
    {
        extraEnvExecution = {
            ...extraEnvExecution,
            NODE_PATH: path.join(__dirname, "../../module_trick"),
        }
    }

    const nodeJSProjectInstallationExitCode = await simpleRun(
        "npm",
        [
            "install"
        ],
        extraEnvInstallation,
        options.path
    );
    if (nodeJSProjectInstallationExitCode != 0)
    {
        throw new Error(`Cannot install nodeJSProject, exit code: ` + nodeJSProjectInstallationExitCode);
    }
    
    const nodeJSProjectExecutionExitCode = await simpleRun(
        "npm",
        [
            "run",
            options.script,
            ...args
        ],
        extraEnvExecution,
        options.path
    );
    if (nodeJSProjectExecutionExitCode != 0)
    {
        throw new Error(`Cannot execute nodeJSProject, exit code: ` + nodeJSProjectExecutionExitCode);
    }
}

function spawnNodeJSProcessSync(options)
{
    const sync = makeSync();
    spawnNodeJSProcess(options)
        .then(() => sync.stop())
        .catch(err => { throw err; });
    sync.wait();
}

module.exports = {
    spawnNodeJSProcess,
    spawnNodeJSProcessSync
}