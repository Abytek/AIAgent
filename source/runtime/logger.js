
const chalk = require("chalk");

function createRuntimeLogger(runtime)
{
    let runtimeLogger = {};

    runtimeLogger.runtime = runtime;

    runtimeLogger.log = function(tags, ...args)
    {
        const parsedTags = [ 
            chalk.rgb(0, 200, 255)("Runtime"), 
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

    return runtimeLogger;
}

module.exports = {
    createRuntimeLogger
};