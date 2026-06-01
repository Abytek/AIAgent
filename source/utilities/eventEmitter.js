
const EventEmitter = require("events");
const { doSync } = require("../utilities/sync");

function makeEventEmitter(options)
{
    const result = new EventEmitter();
    result.emitReversed = function(name, ...args)
    {
        doSync(
            async () => {
                const listeners = result.rawListeners(name);

                for (const listener of listeners.reverse()) {
                    await listener(...args);
                }
            }
        )
    }
    for (const key in options)
    {
        result[key] = options[key];
    }
    return result;
}

module.exports = {
    makeEventEmitter
}