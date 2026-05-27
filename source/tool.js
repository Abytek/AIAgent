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

module.exports = { 
    importTools
}