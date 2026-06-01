const path = require("path");
const fs = require("fs");
const { simpleRun } = require("../utilities/simpleRun");
const { makeSync } = require("../utilities/sync");

async function spawnSkill(options)
{
    if (!options)
    {
        throw new Error(`Requires options`);
    }
    
    if (!("path" in options))
    {
        throw new Error(`Requires "path" in options`);
    }
    const skillPath = options.path;

    const skillInstallationExitCode = await simpleRun(
        "npm",
        [
            "install"
        ],
        {
            NODE_PATH: path.join(__dirname, "../../module_trick")
        },
        skillPath
    );
    if (skillInstallationExitCode != 0)
    {
        throw new Error(`Cannot install skill, exit code: ` + skillInstallationExitCode);
    }
    
    const skillExecutionExitCode = await simpleRun(
        "npm",
        [
            "exec",
            "node",
            "./skill.js",
        ],
        {
            NODE_PATH: path.join(__dirname, "../../module_trick"),
        },
        skillPath
    );
    if (skillExecutionExitCode != 0)
    {
        throw new Error(`Cannot execute skill, exit code: ` + skillExecutionExitCode);
    }
}

function spawnSkillSync(options)
{
    const sync = makeSync();
    spawnSkill(options)
        .then(() => sync.stop())
        .catch(err => { throw err; });
    sync.wait();
}

module.exports = {
    spawnSkill,
    spawnSkillSync
}