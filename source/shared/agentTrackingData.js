
const path = require("path");
const { spawnAgent } = require("../agent/spawn");
const { checkAgentId } = require("./agentId");

function finalizeAgentTrackingData(options)
{
    options = options || {};
    const result = {};

    if (!("id" in options))
    {
        throw new Error(`Requires "id" in options`);
    }
    result.id = options.id;
    if (!checkAgentId(result.id))
    {
        throw new Error(`Invalid "id": ${result.id}`);
    }

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