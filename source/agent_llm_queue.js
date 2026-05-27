const { ChatOpenAI } = require("@langchain/openai");

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

    agentLLMQueue.pendingMessages = [];

    agentLLMQueue.sendMessage = async function(message)
    {
        if (agent.config.debug)
        {
            console.log(`Sending message:`, message);
        }

        const response = await agentLLMQueue.model.invoke([
            message
        ]);

        if (agent.config.debug)
        {
            console.log(`LLM response:`, response);
        }

        return response.content;
    };

    agentLLMQueue.push = function(message)
    {
        if (agent.config.debug)
        {
            console.log(`Pending message:`, message);
        }

        agentLLMQueue.pendingMessages.push(message);
    };

    agentLLMQueue.flush = async function()
    {
        const cachedMessages = [
            ...agentLLMQueue.pendingMessages
        ];

        for (const message of cachedMessages)
        {
            const response =
                await agentLLMQueue.sendMessage(
                    message
                );

            console.log(`Agent:`, response);
        }

        agentLLMQueue.pendingMessages = [];
    };

    return agentLLMQueue;
}

module.exports = {
    createAgentLLMQueue
};