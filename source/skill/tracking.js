
const chalk = require("chalk");
const { io } = require("socket.io-client");
const { makeEventEmitter } = require("../utilities/eventEmitter");

function createSkillTracking(skill)
{
    const skillServer = skill.subsystems.server;

    const skillTracking = makeEventEmitter({
        skill,
        enabled: false,
    });

    // skill events
    skill.on(
        "init",
        async () => {
            await new Promise(
                (resolve) => {
                    skill.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], `Connecting to runtime at:`, skill.config.runtime.url);

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

                    skillTracking.io = io(skill.config.runtime.url, {
                        reconnection: false
                    });
                    
                    skillTracking.io.on("connect", () => {
                        skillTracking.io.emit(
                            "registerSkill", 
                            { 
                                id: skill.id,
                                name: skill.name,
                                revision: skill.revision,
                                url: skillServer.url,
                            },
                            (res) => {
                                if (res.status == 200)
                                {
                                    skillTracking.enabled = true;
                                    skill.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], "Connected to runtime");
                                    sync();
                                }
                                else
                                {
                                    throw new Error(`Failed to connect to runtime: ${res.message}`);
                                    sync();
                                }
                            }
                        );
                    });
            
                    skillTracking.io.on("connect_error", (err) => {
                        skill.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], "Connect to runtime failed");
                        sync();
                    });
            
                    skillTracking.io.on("disconnect", (reason) => {
                        skill.logger.log([ chalk.rgb(60, 200, 30)("Tracking") ], "Disconnected from runtime:", reason);
                        sync();
                    });
                }
            )
        }
    );
    skill.on(
        "release",
        async () => {
            skillTracking.io.close();
        }
    );
    return skillTracking;
}

module.exports = {
    createSkillTracking
}