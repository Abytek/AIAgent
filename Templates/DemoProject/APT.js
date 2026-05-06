
const LocalContext = this;

APT.On(
    "Import",
    function()
    {
        const AbytekAIAgentProject = APT.Extensions.ScopeLinker.Ensure({
            GitDetails: {
                RemoteURL: "git@github.com:Abytek/AIAgent.git"
            }
        });
        const AbytekAIAgent = AbytekAIAgentProject.Context.AbytekAIAgent;
        LocalContext.AbytekAIAgent = AbytekAIAgent;
    }
);