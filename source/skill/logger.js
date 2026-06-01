
const chalk = require("chalk");

function createSkillLogger(skill)
{
    let skillLogger = {};

    skillLogger.skill = skill;

    skillLogger.log = function(tags, ...args)
    {
        const idParts = skill.id.split("@");

        let parsedTags = [ 
            `${chalk.rgb(0, 200, 255)(idParts[0])}${chalk.rgb(220, 220, 220)("@")}${chalk.rgb(0, 200, 150)(idParts[1])}`,
            chalk.rgb(220, 0, 100)(skill.name), 
            chalk.rgb(150, 100, 100)(skill.path),
        ];
        if (skill.revision.length > 0)
        {
            parsedTags.push(chalk.rgb(150, 150, 50)(skill.revision));
        }
        parsedTags = [
            ...parsedTags,
            ...tags
        ]
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

    return skillLogger;
}

module.exports = {
    createSkillLogger
};