const { tool } = require("@langchain/core/tools");
const { z } = require("zod");

module.exports = agent => {
    agent.tool(
        tool(
            async () => {
                console.log(`Agent calls "self_agent.stop" tool, shutting down...`);
                agent.signalShutdown();
                return ``;
            },
            {
                name: "shutdown_self_agent",
                description: "Immediately terminate your own agent instance and stop all further processing, reasoning, message handling, and tool execution."
            }
        )
    );
    agent.tool(
        tool(
            async () => {
                return agent.config.closed_agent_connection_model ? "Closed" : "Open";
            },
            {
                name: "get_agent_connection_model",
                description: "Get the AI agent connection model."
            }
        )
    );
    agent.tool(
        tool(
            async () => {
                return agent.connections;
            },
            {
                name: "list_agent_connection",
                description: "List all your agent connections.",
            }
        )
    );
    agent.tool(
        tool(
            async ({ id, description }) => {
                try 
                {
                    agent.addConnection({ id, description });
                    return `Added connection:\n- Id: ${id}\n- Description: ${description}`;
                }
                catch(err)
                {
                    return err.message;
                }
            },
            {
                name: "add_agent_connection",
                description: "Add/update an agent connection to be able to receive messages from them.",
                
                schema: z.object({
                    id: z
                        .string()
                        .describe(
                            [
`Required, the agent id for the connection to add. This field need to be a valid agent Id that connected to the root manager`,
                            ].join(" ")
                        ),

                    description: z
                        .string()
                        .describe(
                            [
`Describe the connection.`,
                            ].join(" ")
                        ),
                }),
            }
        )
    );
    agent.tool(
        tool(
            async ({ id }) => {
                try 
                {
                    agent.removeConnection(id);
                    return `Removed connection: ${id}`;
                }
                catch(err)
                {
                    return err.message;
                }
            },
            {
                name: "remove_agent_connection",
                description: "Remove an agent from the list of allowed connections for messages.",
                
                schema: z.object({
                    id: z
                        .string()
                        .describe(
                            [
`Required, the agent id for the connection to remove.`,
                            ].join(" ")
                        ),
                }),
            }
        )
    );
};