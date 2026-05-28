
const path = require("path");
const express = require("express");

function getFrontendPublicDirectory()
{
    return path.resolve(__dirname, "../../frontend/public");
}
function getFrontendViewsDirectory()
{
    return path.resolve(getFrontendPublicDirectory(), "source/views");
}
function setupFrontendForExpressApp(app)
{
    app.use(express.static(getFrontendPublicDirectory()));
    app.set("view engine", "ejs")
    app.set(
        "views",
        path.resolve(getFrontendPublicDirectory(), "source/views")
    );
}

module.exports = {
    getFrontendPublicDirectory,
    getFrontendViewsDirectory,
    setupFrontendForExpressApp
}