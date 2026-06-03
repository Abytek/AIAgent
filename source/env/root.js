
function parseRootURL(port)
{
    return `http://localhost:${port}`;
}

function getDefaultRootPort()
{
    if ("ABYTEK_AIAGENT_ROOT_PORT" in process.env)
    {
        return Number(process.env.ABYTEK_AIAGENT_ROOT_PORT);
    }
    return 33999;
}
function getDefaultRootURL()
{
    return parseRootURL(getDefaultRootPort());
}

module.exports = {
    parseRootURL,
    getDefaultRootPort,
    getDefaultRootURL,
}