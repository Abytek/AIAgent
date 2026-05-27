const fs = require("fs");
const path = require("path");

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
            console.log(`Invalid tool call:`, toolCall);
            break;
        }
        const tool = agent.tools[toolCall.name];
        const toolResponse = await tool.invoke(toolCall);
        if (!agent.shouldShutdown)
        {
            agent.llmQueue.push(toolResponse);
        }
    }
}

module.exports = { 
    importTools,
    callTools
}