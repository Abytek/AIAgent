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
                name: "run_powershell",

                description:
                    [
                        "[SYSTEM EXECUTION]",
                        "Execute a PowerShell script on the local machine and return stdout/stderr.",
                        "",
                        "Use this tool when:",
                        "- file operations are required",
                        "- shell commands are required",
                        "- running scripts or programs",
                        "- checking system state",
                        "- interacting with the filesystem",
                        "",
                        "Do NOT use this tool:",
                        "- for normal conversation",
                        "- for reasoning without execution",
                        "- when no system action is required",
                        "",
                        "The script should be concise and task-focused.",
                        "Avoid unnecessary output.",
                        `The maximum returned output is ${MAX_POWERSHELL_TOOL_OUTPUT} characters.`,
                        "",
                        "The cwd parameter should only be provided when a specific working directory is required."
                    ].join("\n"),

                schema: z.object({
                    script: z
                        .string()
                        .describe(
                            [
                                "PowerShell script to execute.",
                                "Must contain valid PowerShell commands.",
                                "Keep the script short and focused.",
                                "Avoid interactive commands.",
                                "Example: Get-ChildItem"
                            ].join(" ")
                        ),

                    cwd: z
                        .string()
                        .optional()
                        .describe(
                            [
                                "Optional working directory path.",
                                "Only provide this if a specific directory is required.",
                                "Example: C:\\Projects\\MyApp"
                            ].join(" ")
                        ),
                }),
            }
        )
    );
};