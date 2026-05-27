#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const deasync = require("deasync");

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

    let isDone = false;
    child.on("exit", code => {
        isDone = true;
    });

    while (!isDone)
    {
        deasync.runLoopOnce();
    }
}

function prepareCodex()
{
    const targetDir = path.join(__dirname, "../.codex");
    const templateDir = path.join(__dirname, "../templates/.codex");
    if (fs.existsSync(templateDir))
    {
        if (!fs.existsSync(targetDir))
        {
            fs.cpSync(
                templateDir,
                targetDir,
                { recursive: true }
            );
        }
    }
}
function prepare9Router()
{
    const targetDir = path.join(__dirname, "../.9router");
    const templateDir = path.join(__dirname, "../templates/.9router");
    if (fs.existsSync(templateDir))
    {
        if (!fs.existsSync(targetDir))
        {
            fs.cpSync(
                templateDir,
                targetDir,
                { recursive: true }
            );
        }
    }
}

switch (command) {
    case "agent":
        run(
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
            }
        );
        run(
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
            }
        );
        break;

    case "codex":
        prepareCodex();
        run(
            "npm",
            [
                "exec",
                "--prefix",
                path.join(__dirname, ".."),
                "--",
                "codex",
                ...args
            ],
            {
                CODEX_HOME: path.join(__dirname, "../.codex")
            }
        );
        break;

    case "9router":
        prepare9Router();
        run(
            "npm",
            [
                "exec",
                "--prefix",
                path.join(__dirname, ".."),
                "--",
                "9router",
                ...args
            ],
            {
                DATA_DIR: path.join(__dirname, "../.9router")
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