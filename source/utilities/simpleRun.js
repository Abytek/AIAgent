const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { makeSync } = require("./sync");

function simpleRun(bin, binArgs, extraEnv = {}, cwd) {
    return new Promise(
        (resolve, reject) => {
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

            let exitCode = 0;
            child.on("error", (err) => {
                reject(err);
            });
            child.on("exit", code => {
                exitCode = code;
                resolve(exitCode);
            });
        }
    );
}
function simpleRunSync(bin, binArgs, extraEnv = {}, cwd) {
    const sync = makeSync();
    let exitCode = 0;
    simpleRun(
        bin,
        binArgs,
        extraEnv,
        cwd
    )
        .then(returnedExitCode => {
            exitCode = returnedExitCode;
            sync.stop();
        })
        .catch(err => { throw err; });
    sync.wait();
    return exitCode;
}

module.exports = {
    simpleRun,
    simpleRunSync
}