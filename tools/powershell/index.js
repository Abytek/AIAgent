const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { spawn } = require("child_process");

async function runPowershell(agent, { script, cwd })
{
    return await new Promise((resolve, reject) => {

        const child = spawn(
            "powershell",
            [
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                script,
            ],
            {
                cwd: cwd || agent.path,
                shell: false,
            }
        );

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", data => {
            stdout += data.toString();
        });

        child.stderr.on("data", data => {
            stderr += data.toString();
        });

        child.on("error", reject);

        child.on("close", code => {

            resolve(
                JSON.stringify(
                    {
                        success: code === 0,
                        exitCode: code,
                        stdout: stdout.trim(),
                        stderr: stderr.trim(),
                    },
                    null,
                    2
                )
            );
        });
    });
}

const MAX_POWERSHELL_TOOL_OUTPUT = 3000;

module.exports = agent => {
    agent.tool(
        tool(
            async (args) => {
                try
                {
                    let consoleOutput = await runPowershell(agent, args);
                    consoleOutput = consoleOutput.substr(0, Math.min(consoleOutput.length, MAX_POWERSHELL_TOOL_OUTPUT));
                    return consoleOutput;
                }
                catch (error)
                {
                    return (
                        error instanceof Error
                            ? error.message
                            : String(error)
                    );
                }
            },
            {
                name: "system.powershell_sync",
                description:
                    `Execute a synchornized PowerShell script and return stdout/stderr. Note that this would block the AI agent and return max of ${MAX_POWERSHELL_TOOL_OUTPUT} console output characters`,

                schema: z.object({
                    script: z
                        .string()
                        .describe("PowerShell script to execute"),

                    cwd: z
                        .string()
                        .optional()
                        .describe("Working directory"),
                }),
            }
        )
    );
};