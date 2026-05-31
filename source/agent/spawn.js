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
    
    let data = { ...options };

    if (!("path" in options))
    {
        throw new Error(`Requires "path" in options`);
    }

    let args = [];
    if ("args" in options)
    {
        args = options.args;
    }

    let additionalExeEnv = {
        ABYTEK_AIAGENT_DATA : JSON.stringify(data, null, 4)
    };

    if (process.env.ABYTEK_AIAGENT_SPAWN_OWNER_MODE == "AIAgent")
    {
        if (!("id" in options))
        {
            throw new Error(`Requires "id" in options => requires setting ABYTEK_AIAGENT_DATA environment variable. For example: ABYTEK_AIAGENT_DATA: "{ \\"id\\": \\"sampleId\\" }"`);
        }
        if (!("connections" in options))
        {
            throw new Error(`Requires "connections" in options => requires setting ABYTEK_AIAGENT_DATA environment variable. For example: ABYTEK_AIAGENT_DATA: "{ \\"connections\\": [ { \\"id\\": \\"<your id>\\", \\"description\\": \\"owner AI agent\\" ] }"`);
        }
    }

    const agentInstallationExitCode = await simpleRun(
        "npm",
        [
            "install"
        ],
        {
            NODE_PATH: path.join(__dirname, "../../module_trick")
        },
        data.path
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
            ...additionalExeEnv,
        },
        data.path
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