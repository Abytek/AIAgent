const { ChatOpenAI } = require("@langchain/openai");
const { callTools } = require("./tool");
const { makeSystemMessage, getMessageRole } = require("./message");

function createAgentLLMQueue(agent)
{
    const model = new ChatOpenAI({
        model: agent.config.model,
        temperature: 0.2,

        apiKey: (agent.config.provider.apiKey == "") ? "dummy" : agent.config.provider.apiKey,

        configuration: {
            baseURL: agent.config.provider.baseURL,
        },
    });

    let agentLLMQueue = {};

    agentLLMQueue.agent = agent;
    agentLLMQueue.model = model;

    agentLLMQueue.lastFlushDate = Date.now();

    agentLLMQueue.setup = function()
    {
        let tools = [];
        for (const toolName in agent.tools)
        {
            const tool = agent.tools[toolName];
            tools.push(tool);
        }
        agentLLMQueue.model = agentLLMQueue.model.bindTools(tools);
    }

    agentLLMQueue.pendingMessages = [];

    agentLLMQueue.sendMessages = async function(messages)
    {
        if (agent.config.debug)
        {
            console.log(`[${agent.id}] Sending messages:`, messages);
        }

        for (const message of messages)
        {
            agent.context.messages.push(message);
        }
        const response = await agentLLMQueue.model.invoke(agent.context.messages);

        agent.context.messages.push(response);
        if (agent.config.debug)
        {
            console.log(`[${agent.id}] LLM response:`, response);
        }

        await callTools(agent, response.tool_calls);

        return response.content;
    };

    agentLLMQueue.push = function(message)
    {
        const messageRole = getMessageRole(message);
        if (agent.config.debug || (messageRole != "system"))
        {
            if (message.content.length > 0)
            {
                console.log(`[${agent.id}] Pending message:`, message.content);
            }
        }
        agentLLMQueue.pendingMessages.push(message);
    };

    agentLLMQueue.flush = async function()
    {
        //
        {
            const newFlushDate = Date.now();
            const secondsFromLastFlush = (newFlushDate - agentLLMQueue.lastFlushDate) / 1000;
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

        if (agentLLMQueue.pendingMessages.length == 0)
        {
            return;
        }

        agentLLMQueue.lastFlushDate = Date.now();

        const cachedMessages = [
            ...agentLLMQueue.pendingMessages
        ];
        agentLLMQueue.pendingMessages = [];

        const response = await agentLLMQueue.sendMessages(
            cachedMessages
        );
        console.log(`[${agent.id}] Response:`, response);
    };

    return agentLLMQueue;
}

module.exports = {
    createAgentLLMQueue
};