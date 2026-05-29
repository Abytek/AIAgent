const fs = require("fs");
const path = require("path");

const { 
    makeAIMessage,
    makeHumanMessage,
    makeSystemMessage
} = require("./message");

function importTools(agent, toolsPath)
{
    if (fs.existsSync(toolsPath)) {
        const entries = fs.readdirSync(toolsPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const indexPath = path.join(toolsPath, entry.name, "index.js");
                if (fs.existsSync(indexPath)) {
                    const toolFunc = require(indexPath);
                    toolFunc(agent);
                }
            }
        }
    }
}

async function callTools(agent, toolCalls)
{
    for (const toolCall of toolCalls)
    {
        if (!(toolCall.name in agent.tools))
        {
            console.log(`Not found tool with name: ${toolCall.name}`);
            agent.message(
                makeSystemMessage(`Not found tool with name: ${toolCall.name}`)
            );
            return;
        }
        const tool = agent.tools[toolCall.name];
        const toolResponse = await tool.invoke(toolCall);
        if (!agent.shouldShutdown)
        {
            agent.message(toolResponse);
        }
    }
}

module.exports = { 
    importTools,
    callTools
}