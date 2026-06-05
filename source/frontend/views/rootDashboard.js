
function renderView_rootDashboard(root, res)
{
    const agentTracker = root.subsystems.agentTracker;
    const agentTrackingDataList = [];
    {
        agentTracker.agentTrackingDatas.forEach(
            agentTrackingData => { agentTrackingDataList.push(agentTrackingData) }
        )
    }

    res.render("rootDashboard", {
        agentTrackingDataList
    })
}

module.exports = {
    renderView_rootDashboard
}