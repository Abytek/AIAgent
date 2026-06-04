
function renderView_agentMonitor(agent, res)
{
    res.render("agentMonitor", {
        agent: {
            id: agent.id,
            path: agent.path,
            brief: agent.brief,
            url: agent.subsystems.server.url,
            processId: process.pid,
            config: agent.config
        }
    })
}

module.exports = {
    renderView_agentMonitor
}