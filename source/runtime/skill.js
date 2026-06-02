
const path = require("path");
const { spawnSkill } = require("../skill/spawn");

function finalizeRuntimeSkillInfo(options)
{
    options = options || {};
    const result = {};

    if (!("url" in options))
    {
        throw new Error(`Requires "url" in options`);
    }
    result.url = options.url;

    if (!("id" in options))
    {
        throw new Error(`Requires "id" in options`);
    }
    result.id = options.id;

    if (!("name" in options))
    {
        throw new Error(`Requires "name" in options`);
    }
    result.name = options.name;

    result.revision = options.revision || "";

    return result;
}

module.exports = {
    finalizeRuntimeSkillInfo,
}