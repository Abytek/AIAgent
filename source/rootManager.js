
// only the framework can execute this function to create the manager server that manages agents.
function createRootManager(options)
{
    if (Options == null)
    {
        Options = new Object();
    }
    
    let manager = new Object();
    manager.path = process.cwd();
    return manager;
}

module.exports = { 
    createRootManager
}
