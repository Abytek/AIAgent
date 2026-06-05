
function checkAgentId(id)
{
    if (!(typeof id === "string"))
    {
        return false;
    }
    const requiredPrefix = "AIAgent@";
    return id.startsWith(requiredPrefix) && (id.length > requiredPrefix.length);
}

module.exports = {
    checkAgentId,
}