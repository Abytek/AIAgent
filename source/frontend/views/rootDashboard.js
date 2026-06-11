
function renderView_rootDashboard(root, res)
{
    const agentTracker = root.subsystems.agentTracker;
    const agentRegistry = root.subsystems.agentRegistry;

    const agentInfoList = agentRegistry.list();

    let agentSlots = [];
    for (const agentInfo of agentInfoList)
    {
        const agentSlot = { ...agentInfo };
        agentSlot.isOnline = agentTracker.has(agentInfo.id);
        if (agentSlot.isOnline)
        {
            const agentTrackingData = agentTracker.get(agentInfo.id);
            Object.assign(agentSlot, agentTrackingData);
        }
        agentSlots.push(agentSlot);
    }
    agentSlots.sort((a, b) => Number(b.isOnline) - Number(a.isOnline));

    res.render("rootDashboard", {
        agentSlots,
    })
}

module.exports = {
    renderView_rootDashboard
}