
const { spawnNodeJSProcess } = require("../utilities/spawnNodeJSProcess");
const { makeSync } = require("../utilities/sync");

async function spawnAgent(options)
{
    options = options || {};
    return await spawnNodeJSProcess({
        ...options,
        script: "agent",
    });
}

function spawnAgentSync(options)
{
    const sync = makeSync();
    spawnAgent(options)
        .then(() => sync.stop())
        .catch(err => { throw err; });
    sync.wait();
}

module.exports = {
    spawnAgent,
    spawnAgentSync
}