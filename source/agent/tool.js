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
            agent.logger.log([ chalk.rgb(60, 200, 30)("Invalid Tool Calling") ], `Not found tool with name: ${toolCall.name}`);
            agent.message(
                makeSystemMessage(`Not found tool with name: ${toolCall.name}`)
            );
            return;
        }

        agent.logger.log([ chalk.rgb(150, 0, 255)(`Calling tool`), chalk.rgb(50, 150, 255)(toolCall.name) ], "...");
        const tool = agent.tools[toolCall.name];
        try
        {
            const toolResponse = await tool.invoke(toolCall);
            if (!agent.shouldShutdown)
            {
                agent.message(toolResponse);
            }
        }
        catch(err)
        {
            agent.message(
                makeSystemMessage({
                    content: `Failed to call tool ${toolCall.name}: ${err.message}`,
                })
            );
            return;
        }
    }
}

module.exports = { 
    callTools
}