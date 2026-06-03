#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { doSync, makeSync } = require("./utilities/sync");
const { simpleRun, simpleRunSync } = require("./utilities/simpleRun");
const { spawnRuntimeSync } = require("./runtime/spawn");
const { spawnAgentSync } = require("./agent/spawn");
const { spawnSkillSync } = require("./skill/spawn");
const { createRoot, createRuntime, getDefaultRuntimeURL } = require("./index");

const command = process.argv[2];
const args = process.argv.slice(3);

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
    case "root":
        {
            const root = createRoot();
            root.run();
        }
        break;

    case "runtime":
        {
            spawnRuntimeSync({
                path: process.cwd()
            });
        }
        break;
    case "runtime.default":
        {
            spawnRuntimeSync({
                path: path.resolve(__dirname, "../templates/runtimes/default"),
            });
        }
        break;

    case "agent":
        {
            spawnAgentSync({
                path: process.cwd()
            });
        }
        break;

    case "skill":
        {
            spawnSkillSync({
                path: process.cwd(),
            });
        }
        break;

    case "codex":
        {
            prepareCodex();
            simpleRunSync(
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
        }
        break;

    case "9router":
        {
            prepare9Router();
            simpleRunSync(
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
        }
        break;

    default:
        console.log(`
Usage:
  abytek-aiagent-cli codex
  abytek-aiagent-cli 9router
`);
}