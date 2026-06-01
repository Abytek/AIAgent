
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { finalizeRuntimeSkillInfo, runtimeSpawnCoreSkills, runtimeWaitCoreSkills } = require("./skill");

function createRuntimeSkillManager(runtime)
{
    const runtimeServer = runtime.subsystems.server;

    const runtimeSkillManager = makeEventEmitter({
        runtime,
        skillinfos: new Map(), // key: skill url, value: skill info
        socketToSkillURL: new Map(), // key: socket IO, value: skill url
    })
    runtimeSkillManager.hasSkillInfo = function(skillURL) {
        return runtimeSkillManager.skillinfos.has(skillURL);
    }
    runtimeSkillManager.findSkillInfo = function(skillURL) {
        if (!runtimeSkillManager.hasSkillInfo(skillURL))
        {
            return null;
        }
        return runtimeSkillManager.skillinfos.get(skillURL);
    }
    runtimeSkillManager.getSkillInfo = function(skillURL) {
        if (!runtimeSkillManager.hasSkillInfo(skillURL))
        {
            throw new Error(`Not found skill: ${skillURL}`);
        }
        return runtimeSkillManager.skillinfos.get(skillURL);
    }

    // runtime skill manager events
    runtimeSkillManager.on(
        "registerSkill",
        async (socket, skillInfo) => {
            runtime.logger.log([ chalk.rgb(60, 200, 30)("Skill") ], `Registered skill:`, skillInfo);
            runtimeSkillManager.skillinfos.set(
                skillInfo.url, 
                skillInfo
            );
        }
    );
    runtimeSkillManager.on(
        "unregisterSkill",
        async (socket, skillInfo) => {
            runtimeSkillManager.skillinfos.delete(skillInfo.url);
            runtime.logger.log([ chalk.rgb(60, 200, 30)("Skill") ], `Unregistered skill:`, chalk.rgb(200, 70, 150)(skillInfo.url));
        }
    );

    // 
    function registerSkill(socket, skillInfo)
    {
        runtimeSkillManager.emit("registerSkill", socket, skillInfo);
    }
    function unregisterSkill(socket, skillInfo)
    {
        runtimeSkillManager.emitReversed("unregisterSkill", socket, skillInfo.url);
    }

    // runtime server events
    runtimeServer.on(
        "setupServerRoutes",
        async () => {
            runtimeServer.app.get("/skillInfos", (req, res) => {
                let skillInfos = [];
                runtimeSkillManager.skillinfos.forEach(
                    value => {
                        skillInfos.push(value);
                    }
                );
                res.status(200).json(skillInfos);
            });
        }
    );
    runtimeServer.on(
        "socketClient_connected",
        async (socket) => {
            socket.on(
                "registerSkill",
                async (skillInfo, ack) => {
                    try 
                    {
                        skillInfo = finalizeRuntimeSkillInfo(skillInfo);
                        registerSkill(socket, skillInfo);
                    }
                    catch(err)
                    {
                        if (ack)
                        {
                            return ack({ status: 400, message: err.message });
                        }
                    }
                    if (ack)
                    {
                        return ack({ status: 200, message: `Registered skill ${skillInfo.url}` });
                    }
                }
            );
            socket.on(
                "unregisterSkill",
                async (skillURL, ack) => {
                    if (!runtimeSkillManager.skillinfos.has(skillURL))
                    {
                        if (ack)
                        {
                            return ack({ status: 400, message: `Not found skill to unregister: ${skillURL}` });
                        }
                    }

                    const skillInfo = runtimeSkillManager.skillinfos.get(skillURL);

                    try 
                    {
                        unregisterSkill(socket, skillInfo);
                    }
                    catch(err)
                    {
                        if (ack)
                        {
                            return ack({ status: 400, message: err.message });
                        }
                    }
                    if (ack)
                    {
                        return ack({ status: 200, message: `Unregistered skill ${skillURL}` });
                    }
                }
            );
        }
    );
    runtimeServer.on(
        "socketClient_disconnected",
        async (socket, reason) => {
            if (!runtimeSkillManager.socketToSkillURL.has(socket))
            {
                return;
            }

            const skillURL = runtimeSkillManager.socketToSkillURL.get(socket);
            const skillInfo = runtimeSkillManager.skillinfos.get(skillURL);
            unregisterSkill(socket, skillInfo);
        }
    );

    // runtime events
    runtime.on(
        "init",
        async () => {
            await runtimeSpawnCoreSkills(runtimeSkillManager);
        }
    );
    runtime.on(
        "release",
        async () => {
            {
                let skillUrls = [];
                runtimeSkillManager.skillinfos.forEach(
                    value => {
                        skillUrls.push(value.url);
                    }
                )
                for (const skillUrl of skillUrls)
                {
                    try
                    {
                        await fetch(`${skillUrl}/stop`, {
                            method: "POST"
                        });
                    }
                    catch(err)
                    {
                    }
                }
            }
            await runtimeWaitCoreSkills(runtimeSkillManager);
        }
    );
    return runtimeSkillManager;
}

module.exports = {
    createRuntimeSkillManager
}