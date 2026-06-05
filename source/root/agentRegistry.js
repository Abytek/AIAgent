
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const { getMessageRole, getMessageContent } = require("../shared/message");
const { finalizeAgentTrackingData } = require("../shared/agentTrackingData");
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
            const agentTrackingDatas = JSON.parse(fs.readFileSync(rootAgentRegistry.file, "utf8"));
            for (const agentTrackingData of agentTrackingDatas)
            {
                const finalizedAgentTrackingData = finalizeAgentTrackingData(agentTrackingData);
                rootAgentRegistry.data.set(finalizedAgentTrackingData.id, finalizedAgentTrackingData);
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
    rootAgentRegistry.has = function(id)
    {
        return rootAgentRegistry.data.has(id);
    }
    rootAgentRegistry.set = function(agentTrackingData)
    {
        const finalizedAgentTrackingData = finalizeAgentTrackingData(agentTrackingData);
        rootAgentRegistry.data.set(finalizedAgentTrackingData.id, finalizedAgentTrackingData);
        rootAgentRegistry.save();
    }
    rootAgentRegistry.unset = function(id)
    {
        if (!rootAgentRegistry.has(id))
        {
            throw new Error(`Not found agent with id: ${id}`);
        }
        rootAgentRegistry.data.delete(id);
        rootAgentRegistry.save();
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
            rootServer.app.post("/agentRegistry/has", async (req, res) =>
            {
                if (!req.body)
                {
                    return res.status(400).send(`Require request body`);
                }

                if (!("id" in req.body))
                {
                    return res.status(400).send(`Require "id" in request body`);
                }
                const id = req.body.id;

                res.status(200).json(rootAgentRegistry.data.has(id));
            });
            rootServer.app.post("/agentRegistry/set", async (req, res) =>
            {
                if (!req.body)
                {
                    return res.status(400).send(`Require request body`);
                }

                if (!("id" in req.body))
                {
                    return res.status(400).send(`Require "id" in request body`);
                }
                const id = req.body.id;

                if (!("brief" in req.body))
                {
                    return res.status(400).send(`Require "brief" in request body`);
                }
                const brief = req.body.brief;
            });
            rootServer.app.post("/agentRegistry/unset", async (req, res) =>
            {
                if (!req.body)
                {
                    return res.status(400).send(`Require request body`);
                }

                if (!("id" in req.body))
                {
                    return res.status(400).send(`Require "id" in request body`);
                }
                const id = req.body.id;
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