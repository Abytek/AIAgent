
const path = require("path");
const { spawnAgent } = require("../agent/spawn");

function finalizeAgentTrackingData(options)
{
    options = options || {};
    const result = {};

    if (!("id" in options))
    {
        throw new Error(`Requires "id" in options`);
    }
    result.id = options.id;

    if (!("url" in options))
    {
        throw new Error(`Requires "url" in options`);
    }
    result.url = options.url;

    return result;
}

module.exports = {
    finalizeAgentTrackingData,
}