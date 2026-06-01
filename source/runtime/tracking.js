
const { io } = require("socket.io-client");
const { makeEventEmitter } = require("../utilities/eventEmitter");

function createRuntimeTracking(runtime)
{
    const runtimeTracking = makeEventEmitter({
        runtime,
    });

    // runtime events
    runtime.on(
        "init",
        async () => {
            // agent.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], `Connecting to root manager at:`, agent.config.rootManager.url);

            // runtimeTracking.socket = io(runtime.config.rootManager.url, {
            //     reconnection: false
            // });
        }
    );
    return runtimeTracking;
}

module.exports = {
    createRuntimeTracking
}