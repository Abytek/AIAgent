#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { doSync, makeSync } = require("./utilities/sync");
const { simpleRun, simpleRunSync } = require("./utilities/simpleRun");
const { spawnAgentSync } = require("./agent/spawn");
const { spawnSkillSync } = require("./skill/spawn");
const { createRootManager, createRuntime, getDefaultRuntimeURL } = require("./index");

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
            const rootManager = createRootManager();
            rootManager.run();
        }
        break;

    case "runtime":
        {
            const runtime = createRuntime();
            runtime.run();
        }
        break;
    case "runtime.generateSkillId":
        {
            console.log(
                doSync(
                    async () => {
                        const response = await fetch(`${getDefaultRuntimeURL()}/generateSkillId`);
                        const responseText = response.text();
                        if (!response.ok)
                        {
                            throw new Error(responseText);
                        }
                        return responseText;
                    }
                )
            );
        }
        break;

    case "agent":
        {
            let data = {};
            if ("ABYTEK_AIAGENT_DATA" in process.env)
            {
                data = { ...JSON.parse(process.env.ABYTEK_AIAGENT_DATA) };
            }
            data.path = process.cwd();
            spawnAgentSync(data);
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