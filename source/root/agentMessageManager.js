
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");

function createRootAgentMessageManager(root)
{
    const rootServer = root.subsystems.server;
    const agentManager = root.subsystems.agentManager;

    const rootAgentMessageManager = makeEventEmitter({
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
                if (!rootManager.agents.has(targetId))
                {
                    return res.status(400).send(`Not found AI agent ${targetId}`);
                }
                const target = rootManager.agents.get(targetId);

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
    return rootAgentMessageManager;
}

module.exports = {
    createRootAgentMessageManager
}