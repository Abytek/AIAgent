const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const { 
    makeAIMessage,
    makeHumanMessage,
    makeSystemMessage
} = require("./message");

async function callTools(agent, toolCalls)
{
    for (const toolCall of toolCalls)
    {
        if (!(toolCall.name in agent.tools))
        {
            agent.logger.log([], `Not found tool with name: ${toolCall.name}`);
            agent.message(
                makeSystemMessage(`Not found tool with name: ${toolCall.name}`)
            );
            return;
        }

        agent.logger.log([ chalk.rgb(150, 0, 255)(`Calling tool`), chalk.rgb(50, 150, 255)(toolCall.name) ], "...");
        const tool = agent.tools[toolCall.name];
        const toolResponse = await tool.invoke(toolCall);
        if (!agent.shouldShutdown)
        {
            agent.message(toolResponse);
        }
    }
}

module.exports = { 
    callTools
}