const fs = require("fs");
const path = require("path");
const { ChatOpenAI } = require("@langchain/openai");
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");

const { 
    makeAIMessage,
    makeHumanMessage,
    makeSystemMessage,
    logMessageOnAgent,
    makeAgentMessageFinalizer,
} = require("./message");

function createAgentLLMManager(agent)
{
    const toolManager = agent.subsystems.toolManager;
    const llmContext = agent.subsystems.llmContext;
    
    const llmManager = makeEventEmitter({
        agent,
        model: new ChatOpenAI({
            model: agent.config.model,
            apiKey: (agent.config.provider.apiKey == "") ? "dummy" : agent.config.provider.apiKey,
            configuration: {
                baseURL: agent.config.provider.baseURL,
            },
        }),
    });

    //
    llmManager.lastFlushDate = Date.now();
    llmManager.pendingMessages = [];

    llmManager.sendMessages = async function(messages)
    {
        if (agent.config.debug)
        {
            agent.logger.log([ `Sending messages` ], messages);
        }

        for (const message of messages)
        {
            llmContext.messages.push(message);
        }
        const response = await llmManager.model.invoke(llmContext.messages);

        llmContext.messages.push(response);
        if (agent.config.debug)
        {
            agent.logger.log([ `LLM response` ], JSON.stringify(response, null, 4));
        }

        if (response.tool_calls)
        {
            await toolManager.callTools(response.tool_calls);
        }
        if (response.invalid_tool_calls)
        {
            for (const toolCall of response.invalid_tool_calls)
            {
                agent.logger.log([ chalk.rgb(60, 200, 30)("Invalid Tool Calling") ], toolCall.name || "", toolCall.error || "");
            }
        }

        return response;
    };

    llmManager.push = function(message)
    {
        llmManager.pendingMessages.push(message);
    };

    llmManager.flush = async function()
    {
        //
        {
            const newFlushDate = Date.now();
            const secondsFromLastFlush = (newFlushDate - llmManager.lastFlushDate) / 1000;
            if (secondsFromLastFlush > agent.config.maxChatDurationInSeconds)
            {
                agent.message(
                    makeSystemMessage(`
It's been ${agent.getSeconds()} seconds from the start.
IMPORTANT:
- Please check what you are waiting for by re-send messages or re-check last tool callings,...
- If you are waiting responses from other agents, you should follow a message to them for check if they are being stucked,...
`)
                );
            }
        }

        if (llmManager.pendingMessages.length == 0)
        {
            return;
        }

        llmManager.lastFlushDate = Date.now();

        const cachedMessages = [
            ...llmManager.pendingMessages
        ];
        llmManager.pendingMessages = [];

        const response = await llmManager.sendMessages(
            cachedMessages
        );
        logMessageOnAgent(agent, response);
    };

    llmManager.message = function(message)
    {
        const cachedMessage = { ...message };

        const agentMessageFinalizer = makeAgentMessageFinalizer();
        if (!agentMessageFinalizer(cachedMessage)) {
            throw new Error(agentMessageFinalizer.toErrorsText());
        }

        logMessageOnAgent(agent, cachedMessage);
        llmManager.push(cachedMessage);
    }
    agent.message = function(message)
    {
        return llmManager.message(message);
    }

    // agent events
    agent.on(
        "ready",
        async () => {
            llmManager.model = llmManager.model.bindTools(toolManager.getToolList());
        }
    );
    agent.on(
        "tick",
        async () => {
            await llmManager.flush();
        }
    );
    return llmManager;
}

module.exports = { 
    createAgentLLMManager
}