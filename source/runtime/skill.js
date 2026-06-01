
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

async function runtimeSpawnCoreSkills(runtimeSkillManager)
{
    const runtime = runtimeSkillManager.runtime;

    runtimeSkillManager.coreSkillPromises = [];
    runtimeSkillManager.coreSkillPromises.push(
        spawnSkill({
            path: path.resolve(__dirname, "../../skills/framework")
        })
    );
    runtimeSkillManager.coreSkillPromises.push(
        spawnSkill({
            path: path.resolve(__dirname, "../../skills/agent")
        })
    );
}
async function runtimeWaitCoreSkills(runtimeSkillManager)
{
    const runtime = runtimeSkillManager.runtime;

    for (const coreSkillPromise of runtimeSkillManager.coreSkillPromises)
    {
        await coreSkillPromise;
    }
}

module.exports = {
    finalizeRuntimeSkillInfo,
    runtimeSpawnCoreSkills,
    runtimeWaitCoreSkills,
}