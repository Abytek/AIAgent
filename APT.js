
APT.Extensions.ScopeLinker.Setup(this);

APT.On(
    "Import",
    function()
    {
        APT.Import("./Source");
    }
);