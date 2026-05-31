
const deasync = require("deasync");

function makeSync() {
    let result = {
        value : false
    }
    result.stop = function()
    {
        result.value = true;
    }
    result.wait = function()
    {
        while (!result.value)
        {
            deasync.runLoopOnce();
        }
    }
    return result;
}
function doSync(callback) {
    let result = null;
    const sync = makeSync();
    (async () => {
        result = await callback();
        sync.stop();
    })();
    sync.wait();
    return result;
}
function runLoopOnce() {
    deasync.runLoopOnce();
}
function loopWhile(predicate) {
    while (true)
    {
        runLoopOnce();
        if (!predicate())
        {
            break;
        }
        runLoopOnce();
    }
}

module.exports = {
    makeSync,
    doSync,
    runLoopOnce,
    loopWhile
}