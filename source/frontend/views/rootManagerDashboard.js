
function renderView_rootManagerDashboard(rootManager, res)
{
    const agentList = [];
    {
        rootManager.agents.forEach(
            agent => { agentList.push(agent) }
        )
    }

    res.render("rootManagerDashboard", {
        agentList
    })
}

module.exports = {
    renderView_rootManagerDashboard
}