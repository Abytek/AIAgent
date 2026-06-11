
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const { getMessageRole, getMessageContent } = require("../shared/message");
const { skillReferenceSchema } = require("../shared/skillReference");
const { makeEventEmitter } = require("../utilities/eventEmitter");

function createRuntimeSkillRegistry(runtime)
{
    const runtimeServer = runtime.subsystems.server;

    const runtimeSkillRegistry = makeEventEmitter({
        runtime,
        file: path.resolve(runtime.dataDirectory, "skillRegistry.json"),
        data: new Map(),
    })

    runtimeSkillRegistry.load = function()
    {
        if (fs.existsSync(runtimeSkillRegistry.file))
        {
            try
            {
                const skillReferences = JSON.parse(fs.readFileSync(runtimeSkillRegistry.file, "utf8"));
                for (const skillReference of skillReferences)
                {
                    const finalizedSkillReference = skillReferenceSchema.finalize(skillReference);
                    runtimeSkillRegistry.data.set(finalizedSkillReference.path, finalizedSkillReference);
                }
            }
            catch(err)
            {
                console.error(err);
            }
        }

        runtimeSkillRegistry.set({
            path: path.resolve(__dirname, "../../skills/abytek.base"),
        });
    }
    runtimeSkillRegistry.save = function()
    {
        fs.writeFileSync(
            runtimeSkillRegistry.file,
            JSON.stringify([ ...runtimeSkillRegistry.data.values() ], null, 4)
        );
    }
    runtimeSkillRegistry.list = function()
    {
        return [ ...runtimeSkillRegistry.data.values() ];
    }
    runtimeSkillRegistry.has = function(path)
    {
        return runtimeSkillRegistry.data.has(path);
    }
    runtimeSkillRegistry.set = function(skillReference)
    {
        const finalizedSkillReference = skillReferenceSchema.finalize(skillReference);
        runtimeSkillRegistry.data.set(finalizedSkillReference.path, finalizedSkillReference);
        runtimeSkillRegistry.save();
        runtime.logger.log([ chalk.rgb(60, 200, 30)("Skill Registry") ], `Set:`, finalizedSkillReference);
    }
    runtimeSkillRegistry.unset = function(path)
    {
        if (!runtimeSkillRegistry.has(path))
        {
            throw new Error(`Not found skill with path: ${path}`);
        }
        const skillTracker = runtime.subsystems.skillTracker;
        if (skillTracker.has(path))
        {
            throw new Error(`${path} is running, cannot unset/delete`);
        }
        runtimeSkillRegistry.data.delete(path);
        runtimeSkillRegistry.save();
        runtime.logger.log([ chalk.rgb(60, 200, 30)("Skill Registry") ], `Delete: `, path);
    }
    runtimeSkillRegistry.get = function(path)
    {
        if (!runtimeSkillRegistry.has(path))
        {
            throw new Error(`Not found skill with path: ${path}`);
        }
        return runtimeSkillRegistry.data.get(path);
    }

    // runtime server events
    runtimeServer.on(
        "setup",
        async () => {
            runtimeServer.app.get("/skillRegistry/list", async (req, res) =>
            {
                res.status(200).json(runtimeSkillRegistry.list());
            });
            runtimeServer.app.get("/skillRegistry/has/:path", async (req, res) =>
            {
                if (!("path" in req.params))
                {
                    return res.status(400).send(`Require "path" parameter`);
                }
                const path = req.params.path;
                res.status(200).json(runtimeSkillRegistry.has(path));
            });
            runtimeServer.app.post("/skillRegistry/set", async (req, res) =>
            {
                if (!req.body)
                {
                    return res.status(400).send(`Require request body`);
                }
                try
                {
                    runtimeSkillRegistry.set({ ...req.body });
                    res.status(200).send(`Succeeded`);
                }
                catch(err)
                {
                    res.status(400).send(err.message);
                }
            });
            runtimeServer.app.post("/skillRegistry/unset/:path", async (req, res) =>
            {
                if (!("path" in req.params))
                {
                    return res.status(400).send(`Require "path" parameter`);
                }
                const path = req.params.path;
                try
                {
                    runtimeSkillRegistry.unset(path);
                    res.status(200).send(`Succeeded`);
                }
                catch(err)
                {
                    res.status(400).send(err.message);
                }
            });
            runtimeServer.app.get("/skillRegistry/get/:path", async (req, res) =>
            {
                if (!("path" in req.params))
                {
                    return res.status(400).send(`Require "path" parameter`);
                }
                const path = req.params.path;
                try
                {
                    res.status(200).json(runtimeSkillRegistry.get(path));
                }
                catch(err)
                {
                    res.status(400).send(err.message);
                }
            });
        }
    );

    // runtime events
    runtime.on(
        "init",
        async () => {
            runtimeSkillRegistry.load();
        }
    )
    return runtimeSkillRegistry;
}

module.exports = {
    createRuntimeSkillRegistry
}