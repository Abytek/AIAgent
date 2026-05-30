
const chalk = require("chalk");

function createAgentLogger(agent)
{
    let agentLogger = {};

    agentLogger.agent = agent;

    agentLogger.log = function(tags, ...args)
    {
        const agentIdParts = agent.id.split("@");

        const parsedTags = [ 
            `${chalk.rgb(0, 200, 255)(agentIdParts[0])}${chalk.rgb(220, 220, 220)("@")}${chalk.rgb(0, 200, 150)(agentIdParts[1])}`, 
            ...tags 
        ];
        let header = ``;
        for (const parsedTag of parsedTags)
        {
            if (header.length != 0)
            {
                header += ' ';
            }
            header += `${chalk.rgb(220, 220, 220)('[')}${parsedTag}${chalk.rgb(220, 220, 220)(']')}`;
        }
        console.log(`${header}\n`, ...args, "\n");
    }

    return agentLogger;
}

module.exports = {
    createAgentLogger
};