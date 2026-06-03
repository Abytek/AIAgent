
const { spawnNodeJSProcess } = require("../utilities/spawnNodeJSProcess");
const { makeSync } = require("../utilities/sync");

async function spawnAgent(options)
{
    options = options || {};

    if (!("serviceInstanceInfo" in options))
    {
        throw new Error(`Requires "serviceInstanceInfo" in options`);
    }
    const serviceInstanceInfo = options.serviceInstanceInfo;

    return await spawnNodeJSProcess({
        ...options,
        script: "agent",
        args: [ 
            Buffer.from(
                JSON.stringify(serviceInstanceInfo, null, 4)
            ).toString("base64"),
        ]
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