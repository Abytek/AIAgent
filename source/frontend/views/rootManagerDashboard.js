
function renderView_rootManagerDashboard(rootManager, res)
{
    res.render("rootManagerDashboard", {
        title: "Hello"
    })
}

module.exports = {
    renderView_rootManagerDashboard
}