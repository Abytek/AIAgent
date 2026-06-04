
const fs = require("fs");
const path = require("path");

function generateCommonStatus(agent)
{
    const result = {
        date: new Date(),
    };
    return result;
}

function saveCommonStatus(agent)
{
    const commonStatusFile = path.resolve(agent.dataDirectory, "commonStatus.json");
    const commonStatus = generateCommonStatus(agent);
    const content = JSON.stringify(commonStatus, null, 4);
    fs.writeFileSync(commonStatusFile, content);
}

module.exports = {
    saveCommonStatus,
}