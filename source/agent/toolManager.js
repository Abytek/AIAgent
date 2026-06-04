const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");

const { 
    makeAIMessage,
    makeHumanMessage,
    makeSystemMessage
} = require("./message");

function createAgentToolManager(agent)
{
    const toolManager = makeEventEmitter({
        agent,
        tools: {},
    });

    toolManager.getToolList = function()
    {
        let tools = [];
        for (const toolName in toolManager.tools)
        {
            const tool = toolManager.tools[toolName];
            tools.push(tool);
        }
        return tools;
    }

    toolManager.tool = function(tool)
    {
        const toolName = tool.name;
        if (toolName in toolManager.tools)
        {
            throw new Error(`Already added tool "${toolName}" to "${agent.id}"`);
        }
        toolManager.tools[toolName] = tool;
        if (agent.config.debug)
        {
            agent.logger.log([ chalk.rgb(60, 200, 30)("Tool Management") ], `Added tool "${toolName}" to "${agent.id}"`);
        }
        return tool;
    }
    agent.tool = function(tool)
    {
        return toolManager.tool(tool);
    }

    toolManager.callTools = async function(toolCalls)
    {
        for (const toolCall of toolCalls)
        {
            if (!(toolCall.name in toolManager.tools))
            {
                agent.logger.log([ chalk.rgb(60, 200, 30)("Invalid Tool Calling") ], `Not found tool with name: ${toolCall.name}`);
                agent.message(
                    makeSystemMessage(`Not found tool with name: ${toolCall.name}`)
                );
                return;
            }

            agent.logger.log([ chalk.rgb(150, 0, 255)(`Calling tool`), chalk.rgb(50, 150, 255)(toolCall.name) ], "...");
            const tool = toolManager.tools[toolCall.name];
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

    return toolManager;
}

module.exports = { 
    createAgentToolManager
}