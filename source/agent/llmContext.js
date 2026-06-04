
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");

function createAgentLLMContext(agent)
{
    const agentContextDirectory = path.resolve(agent.dataDirectory, "agentContexts");
    fs.mkdirSync(agentContextDirectory, { recursive: true });

    const initialDate = new Date();

    const agentContext = makeEventEmitter({
        agent,
        messages: [],
        file: path.resolve(agentContextDirectory, initialDate.toISOString().replaceAll(":", ".") + ".json"),
    });

    agentContext.save = function()
    {
        const dataToSave = {
            initialDate: initialDate,
            messages: agentContext.messages,
        };
        fs.writeFileSync(agentContext.file, JSON.stringify(dataToSave, null, 4));
    }

    return agentContext;
}

module.exports = {
    createAgentLLMContext
};