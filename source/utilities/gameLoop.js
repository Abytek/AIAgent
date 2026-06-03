
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { runLoopOnce, doSync } = require("../utilities/sync");

function makeGameLoop(options) {
    options = options || {};

    const result = makeEventEmitter({
        shouldShutdown: false,
        closed: false,
        ...options,
    });

    result.run = function () {
        doSync(
            async () => {
                await result.emit("init");
                await result.emit("ready");
                while (!result.shouldShutdown) {
                    await result.emit("tick");
                    runLoopOnce();
                }
                await result.emitReversed("release");
            }
        );
    };
    result.signalShutdown = function()
    {
        result.shouldShutdown = true;
    }

    return result;
}

module.exports = { makeGameLoop };