
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

    if (!("brief" in options))
    {
        throw new Error(`Requires "brief" in options`);
    }
    result.brief = options.brief;

    if (!("tags" in options))
    {
        throw new Error(`Requires "tags" in options`);
    }
    result.tags = options.tags;

    if (!("url" in options))
    {
        throw new Error(`Requires "url" in options`);
    }
    result.url = options.url;

    return result;
}

module.exports = {
    finalizeAgentInfo,
}