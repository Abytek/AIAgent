const path = require("path");
const fs = require("fs");
const { simpleRun } = require("./simple_run");

function spawnAgent(options)
{
    return new Promise((resolve, reject) => {
        if (!options)
        {
            throw new Error(`Requires options`);
        }

        if (!("path" in options))
        {
            throw new Error(`Requires "path" in options`);
        }
        const agentPath = options.path;

        let args = [];
        if ("args" in options)
        {
            args = options.args;
        }

        const agentInstallationExitCode = simpleRun(
            "npm",
            [
                "--prefix",
                path.join(__dirname, ".."),
                "exec",
                "npm",
                "install"
            ],
            {
                NODE_PATH: path.join(__dirname, "../module_trick")
            },
            agentPath
        );
        if (agentInstallationExitCode != 0)
        {
            reject(new Error(`Cannot install agent, exit code: ` + agentInstallationExitCode));
        }
        
        const agentExecutionExitCode = simpleRun(
            "npm",
            [
                "--prefix",
                path.join(__dirname, ".."),
                "exec",
                "npm",
                "run",
                "agent",
                ...args
            ],
            {
                NODE_PATH: path.join(__dirname, "../module_trick")
            },
            agentPath
        );
        if (agentExecutionExitCode != 0)
        {
            reject(new Error(`Cannot execute agent, exit code: ` + agentExecutionExitCode));
        }
        resolve();
    })
}

module.exports = {
    spawnAgent
}