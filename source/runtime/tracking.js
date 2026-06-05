
const chalk = require("chalk");
const { io } = require("socket.io-client");
const { makeEventEmitter } = require("../utilities/eventEmitter");

function createRuntimeTracking(runtime)
{
    const runtimeServer = runtime.subsystems.server;

    const runtimeTracking = makeEventEmitter({
        runtime,
        enabled: false,
    });

    // runtime events
    runtime.on(
        "init",
        async () => {
            await new Promise(
                (resolve) => {
                    runtime.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], `Connecting to root at:`, runtime.config.root.url);

                    let synchronized = false;
                    function sync()
                    {
                        if (synchronized)
                        {
                            return;
                        }
                        synchronized = true;
                        resolve();
                    }

                    runtimeTracking.io = io(runtime.config.root.url, {
                        reconnection: false
                    });
                    
                    runtimeTracking.io.on("connect", async () => {
                        await runtimeTracking.io.emit(
                            "registerRuntime", 
                            { 
                                id: runtime.id,
                                url: runtimeServer.url
                            },
                            (res) => {
                                if (res.status == 200)
                                {
                                    runtimeTracking.enabled = true;
                                    runtime.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], "Connected to root");
                                    sync();
                                }
                                else
                                {
                                    throw new Error(`Failed to connect to root: ${res.message}`);
                                    process.exit(1);
                                    sync();
                                }
                            }
                        );
                    });
            
                    runtimeTracking.io.on("connect_error", (err) => {
                        runtime.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], "Connect to root failed");
                        process.exit(1);
                        sync();
                    });
            
                    runtimeTracking.io.on("disconnect", (reason) => {
                        runtime.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], "Disconnected from root:", reason);
                        process.exit(1);
                        sync();
                    });
                }
            )
        }
    );
    runtime.on(
        "release",
        async () => {
            runtimeTracking.io.close();
        }
    );
    return runtimeTracking;
}

module.exports = {
    createRuntimeTracking
}