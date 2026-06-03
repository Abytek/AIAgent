
const EventEmitter = require("events");

function makeEventEmitter(options = {})
{
    const result = new EventEmitter();

    result.emit = async function(name, ...args)
    {
        const listeners = result.rawListeners(name);

        for (const listener of listeners)
        {
            await listener(...args);
        }
    };

    result.emitReversed = async function(name, ...args)
    {
        const listeners =
            result.rawListeners(name).slice().reverse();

        for (const listener of listeners)
        {
            await listener(...args);
        }
    };

    Object.assign(result, options);

    return result;
}

module.exports = {
    makeEventEmitter
}