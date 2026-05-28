
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
    const sync = makeSync();
    (async () => {
        callback();
        sync.value = true;
    })();
    sync.wait();
}
function runLoopOnce() {
    deasync.runLoopOnce();
}
function loopWhile(predicate) {
    while (true)
    {
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