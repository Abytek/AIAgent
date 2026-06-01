
function getDefaultRootManagerPort()
{
    if ("ABYTEK_AIAGENT_ROOT_MANAGER_PORT" in process.env)
    {
        return Number(process.env.ABYTEK_AIAGENT_ROOT_MANAGER_PORT);
    }
    return 33999;
}
function getDefaultRootManagerURL()
{
    return `http://localhost:${getDefaultRootManagerPort()}`;
}

module.exports = {
    getDefaultRootManagerPort,
    getDefaultRootManagerURL
}