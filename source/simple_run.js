const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { makeSync } = require("./sync");

function simpleRun(bin, binArgs, extraEnv = {}, cwd) {
    if (!cwd)
    {
        cwd = process.cwd();
    }
    const child = spawn(
        bin,
        binArgs,
        {
            cwd: cwd,
            stdio: "inherit",
            shell: process.platform === "win32",
            env: {
                ...process.env,
                ...extraEnv
            }
        }
    );

    const sync = makeSync();
    let exitCode = 0;
    child.on("exit", code => {
        exitCode = code;
        sync.stop();
    });
    sync.wait();
    return exitCode;
}

module.exports = {
    simpleRun
}