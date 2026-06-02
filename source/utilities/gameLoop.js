
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { runLoopOnce } = require("../utilities/sync");

function makeGameLoop(options) {
    options = options || {};

    const result = makeEventEmitter({
        shouldShutdown: false,
        closed: false,
    });

    result.run = function () {
        result.emit("init");
        result.emit("ready");
        while (!result.shouldShutdown) {
            result.emit("tick");
            runLoopOnce();
        }
        result.emitReversed("release");
    };
    result.signalShutdown = function()
    {
        result.shouldShutdown = true;
    }

    return result;
}

module.exports = { makeGameLoop };