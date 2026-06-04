
const chalk = require("chalk");

function createRootLogger(root)
{
    let rootLogger = {};

    rootLogger.root = root;

    rootLogger.log = function(tags, ...args)
    {
        const idParts = root.id.split("@");

        const parsedTags = [ 
            `${chalk.rgb(0, 200, 255)(idParts[0])}${chalk.rgb(220, 220, 220)("@")}${chalk.rgb(0, 200, 150)(idParts[1])}`,
            chalk.rgb(220, 0, 100)(root.path), 
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

    return rootLogger;
}

module.exports = {
    createRootLogger
};