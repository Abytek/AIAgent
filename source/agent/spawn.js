const path = require("path");
const fs = require("fs");
const { simpleRun } = require("../utilities/simpleRun");
const { makeSync } = require("../utilities/sync");

async function spawnAgent(options)
{
    if (!options)
    {
        throw new Error(`Requires options`);
    }
    
    if (!("path" in options))
    {
        throw new Error(`Requires "path" in options`);
    }

    let args = options.args || [];

    const agentInstallationExitCode = await simpleRun(
        "npm",
        [
            "install"
        ],
        {
            NODE_PATH: path.join(__dirname, "../../module_trick"),
        },
        options.path
    );
    if (agentInstallationExitCode != 0)
    {
        throw new Error(`Cannot install agent, exit code: ` + agentInstallationExitCode);
    }
    
    const agentExecutionExitCode = await simpleRun(
        "npm",
        [
            "run",
            "agent",
            ...args
        ],
        {
            NODE_PATH: path.join(__dirname, "../../module_trick"),
        },
        options.path
    );
    if (agentExecutionExitCode != 0)
    {
        throw new Error(`Cannot execute agent, exit code: ` + agentExecutionExitCode);
    }
}

function spawnAgentSync(options)
{
    const sync = makeSync();
    spawnAgent(options)
        .then(() => sync.stop())
        .catch(err => { throw err; });
    sync.wait();
}

module.exports = {
    spawnAgent,
    spawnAgentSync
}