
const path = require("path");

function getFrontendPublicDirectory()
{
    return path.resolve(__dirname, "../../frontend/public");
}

module.exports = {
    getFrontendPublicDirectory
}