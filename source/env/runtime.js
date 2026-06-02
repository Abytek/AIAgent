
function parseRuntimeURL(port)
{
    return `http://localhost:${port}`;
}

function getDefaultRuntimePort()
{
    if ("ABYTEK_AIAGENT_RUNTIME_PORT" in process.env)
    {
        return Number(process.env.ABYTEK_AIAGENT_RUNTIME_PORT);
    }
    return 39999;
}
function getDefaultRuntimeURL()
{
    return parseRuntimeURL(getDefaultRuntimePort());
}

module.exports = {
    parseRuntimeURL,
    getDefaultRuntimePort,
    getDefaultRuntimeURL,
}