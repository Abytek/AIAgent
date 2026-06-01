
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { finalizeRuntimeSkillInfo } = require("./skill");

function createRuntimeSkillManager(runtime)
{
    const runtimeServer = runtime.subsystems.server;

    const runtimeSkillManager = makeEventEmitter({
        runtime,
        _skillinfos: new Map(), // key: skill url, value: skill info
        _socketToSkillURL: new Map(), // key: socket IO, value: skill url
    })
    runtimeSkillManager.hasSkillInfo = function(skillURL) {
        return runtimeSkillManager._skillinfos.has(skillURL);
    }
    runtimeSkillManager.findSkillInfo = function(skillURL) {
        if (!runtimeSkillManager.hasSkillInfo(skillURL))
        {
            return null;
        }
        return runtimeSkillManager._skillinfos.get(skillURL);
    }
    runtimeSkillManager.getSkillInfo = function(skillURL) {
        if (!runtimeSkillManager.hasSkillInfo(skillURL))
        {
            throw new Error(`Not found skill: ${skillURL}`);
        }
        return runtimeSkillManager._skillinfos.get(skillURL);
    }

    // runtime skill manager events
    runtimeSkillManager.on(
        "registerSkill",
        async (socket, skillInfo) => {
            runtime.logger.log([ chalk.rgb(60, 200, 30)("Skill") ], `Registered skill:`, chalk.rgb(200, 70, 150)(skillInfo));
            runtimeSkillManager._skillinfos.set(
                skillInfo.url, 
                skillInfo
            );
        }
    );
    runtimeSkillManager.on(
        "unregisterSkill",
        async (socket, skillInfo) => {
            runtimeSkillManager._skillinfos.delete(skillInfo.url);
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
    runtime.subsystems.server.on(
        "socketClient_connected",
        async (socket) => {
            socket.on(
                "registerSkill",
                async (skillInfo, ack) => {
                    skillInfo = finalizeRuntimeSkillInfo(skillInfo);

                    try 
                    {
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
                    if (!runtimeSkillManager._skillinfos.has(skillURL))
                    {
                        if (ack)
                        {
                            return ack({ status: 400, message: `Not found skill to unregister: ${skillURL}` });
                        }
                    }

                    const skillInfo = runtimeSkillManager._skillinfos.get(skillURL);

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
    runtime.subsystems.server.on(
        "socketClient_disconnected",
        async (socket, reason) => {
            if (!runtimeSkillManager._socketToSkillURL.has(socket))
            {
                return;
            }

            const skillURL = runtimeSkillManager._socketToSkillURL.get(socket);
            const skillInfo = runtimeSkillManager._skillInfos.get(skillURL);
            unregisterSkill(socket, skillInfo);
        }
    );

    // runtime events
    runtime.on(
        "init",
        async () => {
        }
    );
    runtime.on(
        "release",
        async () => {
        }
    );
    return runtimeSkillManager;
}

module.exports = {
    createRuntimeSkillManager
}