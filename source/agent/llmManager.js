const fs = require("fs");
const path = require("path");
const { ChatOpenAI } = require("@langchain/openai");
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");

const { 
    makeAIMessage,
    makeHumanMessage,
    makeSystemMessage,
    getMessageContent,
    logMessageOnAgent,
    agentMessageSchema,
} = require("../shared/message");

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
    llmManager.initialFlushDate = Date.now();
    llmManager.lastFlushDate = llmManager.initialFlushDate;
    llmManager.pendingCommands = [];

    llmManager.processCommands = async function(commands)
    {
        if (agent.config.debug)
        {
            agent.logger.log([ `Processing commands` ], commands);
        }

        for (const command of commands)
        {
            command();
        }

        const response = await llmManager.model.invoke(llmContext.messages);

        llmContext.outputMessage(response);
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

    llmManager.flush = async function()
    {
        //
        {
            const newFlushDate = Date.now();
            const secondsFromLastFlush = (newFlushDate - llmManager.lastFlushDate) / 1000;
            const secondsFromInitialFlush = (newFlushDate - llmManager.initialFlushDate) / 1000;
            if (secondsFromLastFlush > agent.config.maxChatDurationInSeconds)
            {
                agent.message(
                    makeSystemMessage(`
It's been ${secondsFromInitialFlush} seconds from the start.
IMPORTANT:
- Please check what you are waiting for by re-send messages or re-check last tool callings,...
- If you are waiting responses from other agents, you should follow a message to them for check if they are being stucked,...
- Things/tool results might be changed, so you may need to re-check, re-call some tools if needed.
`)
                );
            }
        }

        if (llmManager.pendingCommands.length == 0)
        {
            return;
        }

        llmManager.lastFlushDate = Date.now();

        const cachedCommands = [
            ...llmManager.pendingCommands
        ];
        llmManager.pendingCommands = [];

        const response = await llmManager.processCommands(
            cachedCommands
        );
        logMessageOnAgent(agent, response);
    };

    llmManager.message = function(message)
    {
        const cachedMessage = agentMessageSchema.finalize({ ...message });
        logMessageOnAgent(agent, cachedMessage);
        llmManager.pendingCommands.push(
            () => {
                if (agent.config.debug)
                {
                    agent.logger.log([ `Sending message` ], cachedMessage);
                }
                llmContext.inputMessage(cachedMessage);
            }
        );
    }
    agent.message = function(message)
    {
        return llmManager.message(message);
    }

    llmManager.markConversationStarted = function(message)
    {
        llmManager.pendingCommands.push(
            () => {
                llmContext.markConversationStarted();
            }
        );
    }

    // agent events
    agent.on(
        "ready",
        async () => {
            llmManager.model = llmManager.model.bindTools(toolManager.getToolList());
            for (const message of agent.desc.messages)
            {
                llmManager.message(message);
            }
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