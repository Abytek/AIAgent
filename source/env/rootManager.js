
function parseRootManagerURL(port)
{
    return `http://localhost:${port}`;
}

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
    return parseRootManagerURL(getDefaultRootManagerPort());
}

module.exports = {
    parseRootManagerURL,
    getDefaultRootManagerPort,
    getDefaultRootManagerURL,
}