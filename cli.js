#!/usr/bin/env node

const path = require("path");
const { spawn } = require("child_process");

const userCwd = process.cwd();


const command = process.argv[2];
const args = process.argv.slice(3);

function run(bin, binArgs, extraEnv = {}) {
    const child = spawn(
        bin,
        binArgs,
        {
            cwd: userCwd,
            stdio: "inherit",
            shell: process.platform === "win32",
            env: {
                ...process.env,
                ...extraEnv
            }
        }
    );

    child.on("exit", code => {
        process.exit(code ?? 0);
    });
}

switch (command) {
    case "codex":
        run(
            "npm",
            [
                "exec",
                "--prefix",
                __dirname,
                "--",
                "codex",
                "--model",
                "general-coding"
            ],
            {
                CODEX_HOME: path.join(__dirname, ".codex")
            }
        );
        break;

    case "9router":
        run(
            routerBin,
            args,
            {
                DATA_DIR: path.join(__dirname, ".9router")
            }
        );
        break;

    default:
        console.log(`
Usage:
  abytek-aiagent-cli codex
  abytek-aiagent-cli 9router
`);
}