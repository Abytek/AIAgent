
function renderView_rootDashboard(root, res)
{
    const agentList = [];
    {
        root.agents.forEach(
            agent => { agentList.push(agent) }
        )
    }

    res.render("rootDashboard", {
        agentList
    })
}

module.exports = {
    renderView_rootDashboard
}