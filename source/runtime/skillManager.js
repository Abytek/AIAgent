
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { finalizeRuntimeSkillInfo } = require("./skill");

function createRuntimeSkillManager(runtime)
{
    const runtimeServer = runtime.subsystems.server;

    const runtimeSkillManager = makeEventEmitter({
        runtime,
        skillinfos: new Map(), // key: skill id, value: skill info
        socketToSkillId: new Map(), // key: socket IO, value: skill id
    })
    runtimeSkillManager.hasSkillInfo = function(skillId) {
        return runtimeSkillManager.skillinfos.has(skillId);
    }
    runtimeSkillManager.findSkillInfo = function(skillId) {
        if (!runtimeSkillManager.hasSkillInfo(skillId))
        {
            return null;
        }
        return runtimeSkillManager.skillinfos.get(skillId);
    }
    runtimeSkillManager.getSkillInfo = function(skillId) {
        if (!runtimeSkillManager.hasSkillInfo(skillId))
        {
            throw new Error(`Not found skill: ${skillId}`);
        }
        return runtimeSkillManager.skillinfos.get(skillId);
    }

    // runtime skill manager events
    runtimeSkillManager.on(
        "registerSkill",
        async (socket, skillInfo) => {
            runtime.logger.log([ chalk.rgb(60, 200, 30)("Skill") ], `Registered skill:`, skillInfo);
            runtimeSkillManager.skillinfos.set(
                skillInfo.id, 
                skillInfo
            );
        }
    );
    runtimeSkillManager.on(
        "unregisterSkill",
        async (socket, skillInfo) => {
            runtimeSkillManager.skillinfos.delete(skillInfo.id);
            runtime.logger.log([ chalk.rgb(60, 200, 30)("Skill") ], `Unregistered skill:`, chalk.rgb(200, 70, 150)(skillInfo.id));
        }
    );

    // 
    async function registerSkill(socket, skillInfo)
    {
        await runtimeSkillManager.emit("registerSkill", socket, skillInfo);
    }
    async function unregisterSkill(socket, skillInfo)
    {
        await runtimeSkillManager.emitReversed("unregisterSkill", socket, skillInfo);
    }

    // runtime server events
    runtimeServer.on(
        "setup",
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

            let nextSkillIndex = 0;
            runtimeServer.app.get("/generateSkillId", (req, res) => {
                let skillIndex = nextSkillIndex;
                res.status(200).send(`${runtime.id.replaceAll("Runtime", "Skill")}.${skillIndex}`);
                ++nextSkillIndex;
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
                        await registerSkill(socket, skillInfo);
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
                        return ack({ status: 200, message: `Registered skill` });
                    }
                }
            );
            socket.on(
                "unregisterSkill",
                async (skillId, ack) => {
                    if (!runtimeSkillManager.skillinfos.has(skillId))
                    {
                        if (ack)
                        {
                            return ack({ status: 400, message: `Not found skill to unregister: ${skillId}` });
                        }
                    }

                    const skillInfo = runtimeSkillManager.skillinfos.get(skillId);

                    try 
                    {
                        await unregisterSkill(socket, skillInfo);
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
                        return ack({ status: 200, message: `Unregistered skill ${skillId}` });
                    }
                }
            );
        }
    );
    runtimeServer.on(
        "socketClient_disconnected",
        async (socket, reason) => {
            if (!runtimeSkillManager.socketToSkillId.has(socket))
            {
                return;
            }

            const skillId = runtimeSkillManager.socketToSkillId.get(socket);
            const skillInfo = runtimeSkillManager.skillinfos.get(skillId);
            await unregisterSkill(socket, skillInfo);
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
            {
                let skillURLs = [];
                runtimeSkillManager.skillinfos.forEach(
                    value => {
                        skillURLs.push(value.url);
                    }
                )
                for (const skillURL of skillURLs)
                {
                    try
                    {
                        await fetch(`${skillURL}/stop`, {
                            method: "POST"
                        });
                    }
                    catch(err)
                    {
                    }
                }
            }
        }
    );
    return runtimeSkillManager;
}

module.exports = {
    createRuntimeSkillManager
}