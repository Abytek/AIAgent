
const { spawnNodeJSProcess } = require("../utilities/spawnNodeJSProcess");
const { makeSync } = require("../utilities/sync");

async function spawnRoot(options)
{
    options = options || {};
    return await spawnNodeJSProcess({
        ...options,
        script: "root",
    });
}

function spawnRootSync(options)
{
    const sync = makeSync();
    spawnRoot(options)
        .then(() => sync.stop())
        .catch(err => { throw err; });
    sync.wait();
}

module.exports = {
    spawnRoot,
    spawnRootSync
}