const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { spawn } = require("child_process");

module.exports = agent => {
    agent.tool(
        tool(
            async ({
                script,
                cwd,
            }) => {
                try
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
                    "Execute a synchornized PowerShell script and return stdout/stderr. Note that this would block the AI agent",

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