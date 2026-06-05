
const path = require("path");
const { spawnAgent } = require("../agent/spawn");

function finalizeAgentInfo(options)
{
    options = options || {};
    const result = {};

    if (!("id" in options))
    {
        throw new Error(`Requires "id" in options`);
    }
    result.id = options.id;

    result.brief = options.brief || "";
    result.tags = options.tags || [];

    return result;
}

module.exports = {
    finalizeAgentInfo,
}