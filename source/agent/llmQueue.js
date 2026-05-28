const { ChatOpenAI } = require("@langchain/openai");
const { callTools } = require("./tool");

function createAgentLLMQueue(agent)
{
    const model = new ChatOpenAI({
        model: agent.config.model,

        apiKey: (agent.config.provider.apiKey == "") ? "dummy" : agent.config.provider.apiKey,

        configuration: {
            baseURL: agent.config.provider.baseURL,
        },
    });

    let agentLLMQueue = {};

    agentLLMQueue.agent = agent;
    agentLLMQueue.model = model;

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
        if (agent.config.debug || (message.role != "system"))
        {
            console.log(`[${agent.id}] Pending message:`, message);
        }
        agentLLMQueue.pendingMessages.push(message);
    };

    agentLLMQueue.flush = async function()
    {
        if (agentLLMQueue.pendingMessages.length == 0)
        {
            return;
        }
        {
            let shouldFlush = false;
            for (const message of agentLLMQueue.pendingMessages)
            {
                if ((message.role != "system") || message.force)
                {
                    shouldFlush = true;
                    break;
                }
            }
            if (!shouldFlush)
            {
                return;
            }
        }

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