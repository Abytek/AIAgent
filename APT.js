
const LocalContext = this;

APT.Extensions.ScopeLinker.Setup(this);

APT.On(
    "Import",
    function()
    {
        const AbytekAIAgent = new Object();

        const GlobalContext = AMJS.GetGlobalContext();
        GlobalContext.AbytekAIAgent = AbytekAIAgent;
        LocalContext.AbytekAIAgent = AbytekAIAgent;

        APT.Import("./Server");
    }
);