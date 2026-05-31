const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { makeSystemMessage } = require("../message");
const pty = require("node-pty");
const chalk = require("chalk");

const shell = process.platform === "win32"
    ? "powershell.exe"
    : "bash";

const MAX_CHUNK_CHARS = 2000;

function coreSetupTerminal(agent) {

    const terminals = {};
    agent.external.terminals = terminals;

    let nextTerminalId = 0;
    function generateTerminalId()
    {
        const terminalId = nextTerminalId;
        nextTerminalId++;
        return `LocalTerminal@${terminalId}`;
    }

    agent.message(
        makeSystemMessage({
            content: `
# AI AGENT TERMINAL SYSTEM
- To use terminal, you need to create a terminal then the system will return you a terminal id.
- To send input into a specific terminal, use "add_terminal_input" tool with terminal id.
- Output from a specific terminal is continuously streaming to you by system messages.
- IMPORTANT: your terminals cannot be accessed by other agents!
`
        })
    )

    agent.tool(
        tool(
            async ({ cwd, env }) => {

                const dirtyEnv = env;

                cwd = cwd || process.cwd();
                env = { ...process.env, ...dirtyEnv };

                try {
                    const terminal = { 
                        id: generateTerminalId(),
                        output: "",
                        exitCode: null,
                    };
                    terminals[terminal.id] = terminal;

                    const ptyInstance = pty.spawn(shell, [], {
                        name: `${agent.id}.${terminal.id}`,
                        cwd,
                        env,
                        useConpty: false
                    });
                    terminal.ptyInstance = ptyInstance;

                    ptyInstance.onData(data => {
                        const chunkOffset = terminal.output.length;
                        const chunkSize = data.length;

                        terminal.output += data;

                        const DisplaySize = Math.min(MAX_CHUNK_CHARS, chunkSize);
                        const DisplayOffset = terminal.output.length - DisplaySize;

                        const displayData = data.slice(-DisplaySize);

                        agent.logger.log(
                            [
                                chalk.rgb(60, 200, 30)(terminal.id),
                                chalk.rgb(100, 100, 220)(`Streaming`),
                                `${chalk.rgb(150, 140, 100)(`Display range`)}: offset=${DisplayOffset}, size=${DisplaySize}`
                            ],
                            displayData
                        );

                        agent.message(
                            makeSystemMessage({
                                content: `[${terminal.id}] [Streaming] [Display range: offset=${DisplayOffset}, size=${DisplaySize}]\n${displayData}`
                            })
                        );
                    });
                    ptyInstance.onExit(({ exitCode }) => {
                        terminal.exitCode = exitCode;
                        terminal.ptyInstance = null;
                        agent.logger.log([ chalk.rgb(60, 200, 30)(terminal.id) ], `Exited with code: ${exitCode}`);
                        agent.message(
                            makeSystemMessage({
                                content: `${terminal.id} exited with exit code: ${exitCode}`
                            })
                        )
                    });
                    return `
Created ${terminal.id}:
- Shell: ${shell}.
- Current Working Directory: ${cwd}.
- Newly set environment: ${JSON.stringify(dirtyEnv, null, 4)}.
`;
                } catch (err) {
                    return `Failed to create terminal: ${err.message}`;
                }
            },
            {
                name: "create_terminal",

                description:
                    [
                        "[SYSTEM EXECUTION]",
                        "Create a terminal for shell tasks.",
                        "",
                        "Use this tool when:",
                        "- You might already have some terminals but wanting to run more shell commands simultaneously",
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
                        "The cwd parameter should only be provided when a specific working directory is required."
                    ].join("\n"),

                schema: z.object({
                    cwd: z
                        .string()
                        .optional()
                        .describe(
                            [
                                "Optional working directory path.",
                                "Only provide this if a specific directory is required.",
                                "Example: C:\\Projects\\MyApp"
                            ].join(" ")
                        )
                        .default(process.cwd()),
                    env: z
                        .object()
                        .optional()
                        .describe(
                            [
                                "Optional environment variables.",
                                "Only provide this if a specific environment variable is required to set.",
                                `Example: { NODE_PATH: "C:/NodePath" }`
                            ].join(" ")
                        )
                        .default({}),
                }),
            }
        )
    );
    agent.tool(
        tool(
            async ({ id }) => {

                if (id in terminals)
                {
                    const terminal = terminals[id];
                    const exitCode = terminal.exitCode;
                    if (exitCode == null)
                    {
                        return `${id} was not exited, exit code: none.`;
                    }
                    return `${id}'s exit code: ${exitCode}`;
                }
                else
                {
                    return `Not found terminal with id: ${id}`;
                }
            },
            {
                name: "get_terminal_exit_code",

                description:
                    [
                        "Get terminal exit code by terminal id",
                    ].join("\n"),

                schema: z.object({
                    id: z
                        .string()
                        .describe(
                            [
                                "The terminal id."
                            ].join(" ")
                        ),
                }),
            }
        )
    );
    agent.tool(
        tool(
            async ({ id, input }) => {

                if (id in terminals)
                {
                    const terminal = terminals[id];
                    const exitCode = terminal.exitCode;
                    if (exitCode != null)
                    {
                        return `${id} was already exited with code ${exitCode}, cannot add terminal input.`;
                    }
                    terminal.ptyInstance.write(input + "\r");
                    return `Added/sent input to ${id}: ${input}`;
                }
                else
                {
                    return `Not found terminal with id: ${id}`;
                }
            },
            {
                name: "add_terminal_input",

                description:
                    [
                        "Add/send terminal input by terminal id",
                    ].join("\n"),

                schema: z.object({
                    id: z
                        .string()
                        .describe(
                            [
                                "The terminal id."
                            ].join(" ")
                        ),
                    input: z
                        .string()
                        .describe(
                            [
                                "The input you want to add to the terminal."
                            ].join(" ")
                        ),
                }),
            }
        )
    );
    agent.tool(
        tool(
            async ({ id, output_chunk_offset, output_chunk_size }) => {

                if (id in terminals)
                {
                    const terminal = terminals[id];
                    if (output_chunk_offset > terminal.output.length)
                    {
                        return `[${id}] output_chunk_offset (${output_chunk_offset}) out of bounds, current terminal output length: ${terminal.output.length}`;
                    }
                    const end_output_chunk_offset = Math.min(
                        output_chunk_offset + output_chunk_size,
                        terminal.output.length
                    );
                    const real_output_chunk_size = end_output_chunk_offset - output_chunk_offset;
                    const outputChunk = terminal.output.slice(output_chunk_offset, end_output_chunk_offset);
                    return `[${id}] [Output size: ${terminal.output.length}] [Output chunk: offset=${output_chunk_offset}, size=${real_output_chunk_size}]\n${outputChunk}`;
                }
                else
                {
                    return `Not found terminal with id: ${id}`;
                }
            },
            {
                name: "read_terminal_output",

                description:
                    [
                        "Read terminal output by terminal id and data chunk range",
                    ].join("\n"),

                schema: z.object({
                    id: z
                        .string()
                        .describe(
                            [
                                "The terminal id."
                            ].join(" ")
                        ),
                    output_chunk_offset: z
                        .number()
                        .describe(
                            [
                                "The output chunk offset to read."
                            ].join(" ")
                        ),
                    output_chunk_size: z
                        .number()
                        .min(1)
                        .max(MAX_CHUNK_CHARS)
                        .describe(
                            [
                                `The output chunk size to read`
                            ].join(" ")
                        ),
                }),
            }
        )
    );
    agent.tool(
        tool(
            async ({}) => {

                let terminalIds = [];
                for (id in terminals)
                {
                    terminalIds.push(id);
                }
                return JSON.stringify(terminalIds, null, 4);
            },
            {
                name: "get_terminal_list",

                description:
                    [
                        "Get terminal list",
                    ].join("\n"),

                schema: z.object({
                }),
            }
        )
    );
}

module.exports = {
    coreSetupTerminal
}