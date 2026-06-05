
const chalk = require("chalk");
const { getMessageRole, getMessageContent } = require("../shared/message");
const { makeEventEmitter } = require("../utilities/eventEmitter");

function createRootAgentCommunicationManager(root)
{
    const rootServer = root.subsystems.server;
    const agentTracker = root.subsystems.agentTracker;

    const rootAgentCommunicationManager = makeEventEmitter({
        root,
    })

    // root server events
    rootServer.on(
        "setup",
        async () => {
            rootServer.app.post("/agent/send_messages", async (req, res) =>
            {
                if (!req.body)
                {
                    return res.status(400).send(`Require request body`);
                }

                if (!("target_id" in req.body))
                {
                    return res.status(400).send(`Require "target_id" in request body`);
                }
                const targetId = req.body.target_id;
                if (!agentTracker.agentTrackingDatas.has(targetId))
                {
                    return res.status(400).send(`Not found AI agent ${targetId}`);
                }
                const target = agentTracker.agentTrackingDatas.get(targetId);

                if (!("from" in req.body))
                {
                    return res.status(400).send(`Require "from" in request body`);
                }
                const from = req.body.from;

                if (!("messages" in req.body))
                {
                    return res.status(400).send(`Require "messages" in request body`);
                }
                const messages = req.body.messages;

                let messagesJoined = "";
                for (const message of messages)
                {
                    messagesJoined += "\n";
                    messagesJoined += `[${getMessageRole(message)}]: ${getMessageContent(message)}`;
                }
                root.logger.log(
                    [ chalk.rgb(60, 200, 30)("Agent") ],
                    `Forwarding messages to agent ${targetId}:`, 
                    messagesJoined.substr(0, Math.min(300, messagesJoined.length)).toString()
                );

                try {
                    const targetRes = await fetch(`${target.url}/send_messages`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            from: from,
                            messages,
                        }),
                    });

                    const responseText = await targetRes.text();

                    if (targetRes.ok) {
                        res.status(200).send(
                            `Successfully sent message from ${from} to ${targetId}`
                        );
                    } else {
                        res.status(400).send(responseText || "");
                    }
                } catch (err) {
                    res.status(500).send(err.message);
                }
            });
        }
    );
    return rootAgentCommunicationManager;
}

module.exports = {
    createRootAgentCommunicationManager
}