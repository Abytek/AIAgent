
const { spawnNodeJSProcess } = require("../utilities/spawnNodeJSProcess");
const { makeSync } = require("../utilities/sync");

async function spawnRuntime(options)
{
    options = options || {};
    return await spawnNodeJSProcess({
        ...options,
        script: "runtime",
    });
}

function spawnRuntimeSync(options)
{
    const sync = makeSync();
    spawnRuntime(options)
        .then(() => sync.stop())
        .catch(err => { throw err; });
    sync.wait();
}

module.exports = {
    spawnRuntime,
    spawnRuntimeSync
}