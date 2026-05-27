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
        console.log(`Sending messages:`, messages);

        for (const message of messages)
        {
            agent.context.messages.push(message);
        }
        const response = await agentLLMQueue.model.invoke(agent.context.messages);

        agent.context.messages.push(response);
        if (agent.config.debug)
        {
            console.log(`LLM response:`, response);
        }

        await callTools(agent, response.tool_calls);

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
        agentLLMQueue.pendingMessages = [];

        if (cachedMessages.length == 0)
        {
            return;
        }

        const response = await agentLLMQueue.sendMessages(
            cachedMessages
        );
        console.log(`Agent:`, response);
    };

    return agentLLMQueue;
}

module.exports = {
    createAgentLLMQueue
};