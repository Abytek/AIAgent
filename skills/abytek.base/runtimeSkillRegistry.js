const { tool } = require("@langchain/core/tools");
const { z } = require("zod");

function importRuntimeSkillRegistry(skill) {

    const agent = skill.agent;

    skill.on(
        "setup",
        async () => {
            agent.tool(
                tool(
                    async () =>
                    {
                        try
                        {
                            const response = await fetch(
                                `${agent.runtimeURL}/skillRegistry/list`
                            );

                            if (!response.ok)
                            {
                                return `Failed to query skill list: ${response.status} ${response.statusText}`;
                            }

                            const skills = await response.json();

                            return [
                                "Here is the list of registered skills:",
                                "",
                                JSON.stringify(skills, null, 4),
                            ].join("\n");
                        }
                        catch (error)
                        {
                            return `Failed to query skill list: ${
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            }`;
                        }
                    },
                    {
                        name: "runtimeSkillRegistry.list",
                        description:
                            "Returns all registered skills in this runtime.",
                    }
                )
            );

            agent.tool(
                tool(
                    async () =>
                    {
                        try
                        {
                            const response = await fetch(
                                `${agent.runtimeURL}/skillRegistry/tags`
                            );

                            if (!response.ok)
                            {
                                return `Failed to query skill tags: ${await response.text()}`;
                            }

                            const tags = await response.json();

                            return [
                                "Available skill tags:",
                                "",
                                JSON.stringify(tags, null, 4),
                            ].join("\n");
                        }
                        catch (error)
                        {
                            return `Failed to query skill tags: ${
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            }`;
                        }
                    },
                    {
                        name: "runtimeSkillRegistry.tags",
                        description:
                            "Returns all tags gathered from registered skills.",
                    }
                )
            );

            agent.tool(
                tool(
                    async ({ path }) =>
                    {
                        try
                        {
                            const response = await fetch(
                                `${agent.runtimeURL}/skillRegistry/has/${encodeURIComponent(path)}`
                            );

                            if (!response.ok)
                            {
                                return `Failed to check skill existence: ${response.status} ${response.statusText}`;
                            }

                            const exists = await response.json();

                            return exists
                                ? `Skill "${path}" exists`
                                : `Skill "${path}" does not exist`;
                        }
                        catch (error)
                        {
                            return `Failed to check skill existence: ${
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            }`;
                        }
                    },
                    {
                        name: "runtimeSkillRegistry.has",
                        description:
                            "Checks whether a skill exists in the runtime skill registry.",
                        schema: z.object({
                            path: z.string(),
                        }),
                    }
                )
            );

            agent.tool(
                tool(
                    async ({ path }) =>
                    {
                        try
                        {
                            const response = await fetch(
                                `${agent.runtimeURL}/skillRegistry/get/${encodeURIComponent(path)}`
                            );

                            if (!response.ok)
                            {
                                return `Failed to get skill info: ${response.status} ${await response.text()}`;
                            }

                            const skillReference = await response.json();

                            return [
                                `Skill information for "${path}":`,
                                "",
                                JSON.stringify(skillReference, null, 4),
                            ].join("\n");
                        }
                        catch (error)
                        {
                            return `Failed to get skill info: ${
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            }`;
                        }
                    },
                    {
                        name: "runtimeSkillRegistry.get",
                        description:
                            "Returns detailed information about a registered skill.",
                        schema: z.object({
                            path: z.string(),
                        }),
                    }
                )
            );

            agent.tool(
                tool(
                    async ({ skillReference }) =>
                    {
                        try
                        {
                            const response = await fetch(
                                `${agent.runtimeURL}/skillRegistry/set`,
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify(skillReference),
                                }
                            );

                            const text = await response.text();

                            if (!response.ok)
                            {
                                return `Failed to register skill: ${text}`;
                            }

                            return `Skill registered successfully`;
                        }
                        catch (error)
                        {
                            return `Failed to register skill: ${
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            }`;
                        }
                    },
                    {
                        name: "runtimeSkillRegistry.set",
                        description:
                            [
                                "Registers a new skill or updates an existing skill.",
                                "The provided object is sent directly to the runtime skill registry."
                            ].join("\n"),
                        schema: z.object({
                            skillReference: z.record(z.any()),
                        }),
                    }
                )
            );

            agent.tool(
                tool(
                    async ({ path }) =>
                    {
                        try
                        {
                            const response = await fetch(
                                `${agent.runtimeURL}/skillRegistry/unset/${encodeURIComponent(path)}`,
                                {
                                    method: "POST",
                                }
                            );

                            const text = await response.text();

                            if (!response.ok)
                            {
                                return `Failed to remove skill: ${text}`;
                            }

                            return `Skill "${path}" removed successfully`;
                        }
                        catch (error)
                        {
                            return `Failed to remove skill: ${
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            }`;
                        }
                    },
                    {
                        name: "runtimeSkillRegistry.unset",
                        description:
                            "Removes a skill from the registry. The skill must not currently be running.",
                        schema: z.object({
                            path: z.string(),
                        }),
                    }
                )
            );
        }
    );
};

module.exports = {
    importRuntimeSkillRegistry
}