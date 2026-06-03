
const path = require("path");
const fs = require("fs");
const os = require("os");
const chalk = require("chalk");
const { makeEventEmitter } = require("./eventEmitter");

function createServiceRegistry(options)
{
    options = options || {};

    if (!("gameLoopServer" in options))
    {
        throw new Error(`Requires "gameLoopServer" in options`);
    }
    const gameLoopServer = options.gameLoopServer;
    const gameLoop = gameLoopServer.gameLoop;

    let serviceRegistry = makeEventEmitter({
        gameLoopServer,
        gameLoop,
    });

    //
    let isReady = false;
    let nextIdIndex = 0;
    serviceRegistry.services = new Map();
    serviceRegistry.serviceInstances = new Map();

    //
    serviceRegistry.generateId = function(prefix = "")
    {
        const idIndex = nextIdIndex;
        nextIdIndex++;
        return `${prefix}${idIndex}`;
    }
    serviceRegistry.process = async function(serviceInstanceInfo)
    {
        if (!serviceRegistry.services.has(serviceInstanceInfo.route))
        {
            throw new Error(`Not registered service with route: ${serviceInstanceInfo.route}`);
        }
        const service = serviceRegistry.services.get(serviceInstanceInfo.route);
        const context = {};
        context.emit = async function(event, ...args)
        {
            const response = await fetch(
                `${serviceInstanceInfo.url}/serviceRegistry/callback`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        id: serviceInstanceInfo.id,
                        event: event,
                        eventEmitMode: "emit",
                        args: args,
                    })
                }
            );
            if (!response.ok)
            {
                throw new Error(await response.text());
            }
            return await response.json();
        }
        context.emitReversed = async function(event, ...args)
        {
            const response = await fetch(
                `${serviceInstanceInfo.url}/serviceRegistry/callback`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        id: serviceInstanceInfo.id,
                        event: event,
                        eventEmitMode: "emitReversed",
                        args: args,
                    })
                }
            );
            if (!response.ok)
            {
                throw new Error(await response.text());
            }
            return await response.json();
        }

        await context.emit("open");
        const value = await service.callback(context, ...serviceInstanceInfo.args);
        await context.emitReversed("close", value);
    }
    serviceRegistry.service = function(route, callback)
    {
        if (serviceRegistry.services.has(route))
        {
            throw new Error(`Already registered service with route: ${route}`);
        }
        if (route.length == 0)
        {
            throw new Error(`Route need to be started by /`);
        }
        if (route[0] != '/')
        {
            throw new Error(`Route need to be started by /`);
        }
        const service = makeEventEmitter({
            route,
            callback,
        });
        serviceRegistry.services.set(route, service);
        gameLoopServer.on(
            "setup",
            async () => {
                gameLoopServer.app.post(`/serviceRegistry/fetch${route}`, async (req, res) => {
                    if (req.body == null)
                    {
                        return res.status(400).send(`Requires request body`);
                    }
                    if (typeof req.body !== "object")
                    {
                        return res.status(400).send(`Requires object request body`);
                    }

                    if (!("info" in req.body))
                    {
                        return res.status(400).send(`Requires "info" in request body`);
                    }
                    const info = req.body.info;

                    if (info.route != route)
                    {
                        return res.status(400).send(`Routes mismatch: ${route} vs ${info.route}`);
                    }

                    try
                    {
                        await serviceRegistry.process(info);
                        return res.status(200).send("ok");
                    }
                    catch(err)
                    {
                        return res.status(400).send(err.message);
                    }
                });
            }
        );
        return service;
    }
    serviceRegistry.serviceInstance = function(route, ...args)
    {
        const id = serviceRegistry.generateId();
        const info = {
            id,
            url: gameLoopServer.url,
            route,
            args,
        };
        const serviceInstance = makeEventEmitter({
            ...info,
            opened: false,
            closed: false,
            value: null,
            error: null,
        });
        serviceInstance.getInfo = function()
        {
            return info;
        }
        serviceInstance.on("open", async (context) => {
            if (serviceInstance.opened)
            {
                throw new Error(`Cannot re-open a service instance`);
            }
            serviceInstance.opened = true;
        });
        serviceInstance.on("close", async (context, value) => {
            if (serviceInstance.closed)
            {
                throw new Error(`Cannot re-close a service instance`);
            }
            serviceInstance.value = value;
            serviceInstance.closed = true;
        });
        serviceInstance.on("error", async (error) => {
            if (serviceInstance.error != null)
            {
                throw new Error(`Cannot re-emit error on a service instance`);
            }
            serviceInstance.error = error;
            serviceInstance.closed = true;
        });
        
        serviceInstance.fetch = async function(originURL, options, timeout = 10000)
        {
            options = options || {};

            let controllerSignal = null;
            if (timeout != null)
            {
                const controller = new AbortController();
                controllerSignal = controller.signal;
                setTimeout(() => {
                    controller.abort();
                }, timeout);
            }

            const response = await fetch(
                `${originURL}/serviceRegistry/fetch${route}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        info,
                    }),
                    ...options,
                    signal: controllerSignal,
                }
            );
            if (!response.ok)
            {
                const err = new Error(`Failed to fetch service instance: ${await response.text()}`);
                await serviceInstance.emitReversed("error", err);
                throw err;
            }
            return serviceInstance.value;
        }
        serviceInstance.passive = async function(callback)
        {
            try 
            {
                await callback();
            }
            catch(err)
            {
                await serviceInstance.emitReversed("error", err);
                throw err;
            }
            return serviceInstance.value;
        }

        serviceRegistry.serviceInstances.set(id, serviceInstance);
        return serviceInstance;
    }

    // gameLoop server events
    gameLoopServer.on(
        "setup",
        async () => {
            gameLoopServer.app.get("/serviceRegistry/ready", (req, res) => {
                res.status(200).json(isReady);
            });
            gameLoopServer.app.get("/serviceRegistry/generateId/:prefix", (req, res) => {
                const { prefix } = req.args;
                res.status(200).send(serviceRegistry.generateId(prefix));
            });
            gameLoopServer.app.post("/serviceRegistry/callback", async (req, res) => {
                if (req.body == null)
                {
                    return res.status(400).send(`Requires request body`);
                }
                if (typeof req.body !== "object")
                {
                    return res.status(400).send(`Requires object request body`);
                }

                if (!("id" in req.body))
                {
                    return res.status(400).send(`Requires "id" in request body`);
                }
                const id = req.body.id;
                if (!(typeof id === "string"))
                {
                    return res.status(400).send(`"id" has to be string`);
                }

                if (!("event" in req.body))
                {
                    return res.status(400).send(`Requires "event" in request body`);
                }
                const event = req.body.event;
                if (!(typeof event === "string"))
                {
                    return res.status(400).send(`"event" has to be string`);
                }

                if (!("eventEmitMode" in req.body))
                {
                    return res.status(400).send(`Requires "eventEmitMode" in request body`);
                }
                const eventEmitMode = req.body.eventEmitMode;
                if (!(typeof eventEmitMode === "string"))
                {
                    return res.status(400).send(`"eventEmitMode" has to be string`);
                }

                if (!("args" in req.body))
                {
                    return res.status(400).send(`Requires "args" in request body`);
                }
                const args = req.body.args;
                if (!(Array.isArray(args)))
                {
                    return res.status(400).send(`"args" has to be array`);
                }

                if (!serviceRegistry.serviceInstances.has(id))
                {
                    return res.status(400).send(`Not found service instance with id: ${id}`);
                }
                const serviceInstance = serviceRegistry.serviceInstances.get(id);

                const context = { 
                    result: {}, 
                };
                context.json = function(value) 
                {
                    context.result = value;
                }
                
                try
                {
                    if (eventEmitMode == "emit")
                    {
                        await serviceInstance.emit(event, context, ...args);
                    }
                    else if (eventEmitMode == "emitReversed")
                    {
                        await serviceInstance.emitReversed(event, context, ...args);
                    }
                    else
                    {
                        return res.status(400).send(`Invalid "eventEmitMode"`);
                    }
                }
                catch(err)
                {
                    return res.status(400).send(err.message);
                }

                return res.status(200).json(context.result || {});
            });
        }
    );
    gameLoopServer.on(
        "open",
        async () => {
        }
    );
    gameLoopServer.on(
        "close",
        async () => {
        }
    );
    gameLoopServer.on(
        "socketClient_connected",
        async (socket) => {
        }
    );
    gameLoopServer.on(
        "socketClient_disconnected",
        async (socket, reason) => {
        }
    );

    // 
    gameLoop.on(
        "ready", 
        () => {
            isReady = true;
        }
    );
    return serviceRegistry;
}

module.exports = {
    createServiceRegistry
};