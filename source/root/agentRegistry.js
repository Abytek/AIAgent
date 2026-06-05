
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const { getMessageRole, getMessageContent } = require("../shared/message");
const { finalizeAgentInfo } = require("../shared/agentInfo");
const { makeEventEmitter } = require("../utilities/eventEmitter");

function createRootAgentRegistry(root)
{
    const rootServer = root.subsystems.server;

    const rootAgentRegistry = makeEventEmitter({
        root,
        file: path.resolve(root.dataDirectory, "agentRegistry.json"),
        data: new Map(),
    })

    rootAgentRegistry.load = function()
    {
        if (!fs.existsSync(rootAgentRegistry.file))
        {
            return;
        }

        try
        {
            const agentInfos = JSON.parse(fs.readFileSync(rootAgentRegistry.file, "utf8"));
            for (const agentInfo of agentInfos)
            {
                const finalizedAgentInfo = finalizeAgentInfo(agentInfo);
                rootAgentRegistry.data.set(finalizedAgentInfo.id, finalizedAgentInfo);
            }
        }
        catch(err)
        {
            console.error(err);
        }
    }
    rootAgentRegistry.save = function()
    {
        fs.writeFileSync(
            rootAgentRegistry.file,
            JSON.stringify([ ...rootAgentRegistry.data.values() ], null, 4)
        );
    }
    rootAgentRegistry.list = function()
    {
        return [ ...rootAgentRegistry.data.values() ];
    }
    rootAgentRegistry.has = function(id)
    {
        return rootAgentRegistry.data.has(id);
    }
    rootAgentRegistry.set = function(agentInfo)
    {
        const finalizedAgentInfo = finalizeAgentInfo(agentInfo);
        rootAgentRegistry.data.set(finalizedAgentInfo.id, finalizedAgentInfo);
        rootAgentRegistry.save();
        root.logger.log([ chalk.rgb(60, 200, 30)("Agent Registry") ], `Set:`, agentInfo);
    }
    rootAgentRegistry.unset = function(id)
    {
        if (!rootAgentRegistry.has(id))
        {
            throw new Error(`Not found agent with id: ${id}`);
        }
        const agentTracker = root.subsystems.agentTracker;
        if (agentTracker.has(id))
        {
            throw new Error(`${id} is running, cannot unset/delete`);
        }
        rootAgentRegistry.data.delete(id);
        rootAgentRegistry.save();
        root.logger.log([ chalk.rgb(60, 200, 30)("Agent Registry") ], `Delete: `, id);
    }
    rootAgentRegistry.get = function(id)
    {
        if (!rootAgentRegistry.has(id))
        {
            throw new Error(`Not found agent with id: ${id}`);
        }
        return rootAgentRegistry.data.get(id);
    }

    // root server events
    rootServer.on(
        "setup",
        async () => {
            rootServer.app.get("/agentRegistry/list", async (req, res) =>
            {
                res.status(200).json(rootAgentRegistry.list());
            });
            rootServer.app.get("/agentRegistry/has/:id", async (req, res) =>
            {
                if (!("id" in req.params))
                {
                    return res.status(400).send(`Require "id" parameter`);
                }
                const id = req.params.id;
                res.status(200).json(rootAgentRegistry.has(id));
            });
            rootServer.app.post("/agentRegistry/set", async (req, res) =>
            {
                if (!req.body)
                {
                    return res.status(400).send(`Require request body`);
                }
                try
                {
                    rootAgentRegistry.set({ ...req.body });
                    res.status(200).send(`Succeeded`);
                }
                catch(err)
                {
                    res.status(400).send(err.message);
                }
            });
            rootServer.app.post("/agentRegistry/unset/:id", async (req, res) =>
            {
                if (!("id" in req.params))
                {
                    return res.status(400).send(`Require "id" parameter`);
                }
                const id = req.params.id;
                try
                {
                    rootAgentRegistry.unset(id);
                    res.status(200).send(`Succeeded`);
                }
                catch(err)
                {
                    res.status(400).send(err.message);
                }
            });
            rootServer.app.get("/agentRegistry/get/:id", async (req, res) =>
            {
                if (!("id" in req.params))
                {
                    return res.status(400).send(`Require "id" parameter`);
                }
                const id = req.params.id;
                try
                {
                    res.status(200).json(rootAgentRegistry.get(id));
                }
                catch(err)
                {
                    res.status(400).send(err.message);
                }
            });
        }
    );

    // root events
    root.on(
        "init",
        async () => {
            rootAgentRegistry.load();
        }
    )
    return rootAgentRegistry;
}

module.exports = {
    createRootAgentRegistry
}