
function renderView_rootDashboard(root, res)
{
    const agentManager = root.subsystems.agentManager;
    const agentInfoList = [];
    {
        agentManager.agentInfos.forEach(
            agentInfo => { agentInfoList.push(agentInfo) }
        )
    }

    res.render("rootDashboard", {
        agentInfoList
    })
}

module.exports = {
    renderView_rootDashboard
}