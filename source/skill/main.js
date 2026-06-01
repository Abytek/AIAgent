const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const chalk = require("chalk");
const { makeGameLoop } = require("../utilities/gameLoop");
const { loadSkillConfig } = require("./config");
const { createSkillLogger } = require("./logger");
const { createSkillSubsystems } = require("./subsystems");
const { doSync } = require("../utilities/sync");

function createSkillId(config)
{
    return doSync(
        async () => {
            const response = await fetch(`${config.runtime.url}/generateSkillId`);
            const responseText = response.text();
            if (!response.ok)
            {
                throw new Error(responseText);
            }
            return responseText;
        }
    );

    const interfaces = os.networkInterfaces();

    const identities = [];

    for (const iface of Object.values(interfaces)) {
        for (const address of iface || []) {
            if (address.internal) continue;

            // IPv4
            if (address.family === "IPv4") {
                identities.push(address.address);
            }
        }
    }

    identities.sort();

    const idHash =  crypto
        .createHash("sha256")
        .update(
            JSON.stringify({
                identities,
                port: config.server.port,
            })
        )
        .digest("base64url")
        .slice(0, 12);
    return `Skill@${idHash}`;
}

// the main function for users to create skills
function createSkill(options) {
    options = options || {};

    const skill = makeGameLoop();

    skill.path = options.path || process.cwd();

    skill.config = loadSkillConfig(skill);
    skill.id = createSkillId(skill.config);
    skill.logger = createSkillLogger(skill);

    if (!("name" in options))
    {
        throw new Error(`Requires "name" in options`);
    }
    skill.name = options.name;

    skill.revision = options.revision || "";

    skill.logger.log([], "Running...");
    
    skill.tags = new Map();
    skill.tag = function(tagName)
    {
        const tag = {
            name: tagName,
            dependencies: []
        };
        tag.use = function(...dependencies)
        {
            for (const dependency of dependencies)
            {
                if (tag.dependencies.includes(dependency))
                {
                    continue;
                }
                tag.dependencies.push(dependency);
            }
            return tag;
        }
        skill.tags.set(tagName, tag);
        return tag;
    }

    skill.subsystems = {};
    createSkillSubsystems(skill);
    return skill;
}

module.exports = { createSkill };