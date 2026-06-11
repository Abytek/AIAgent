
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { doSync } = require("../utilities/sync");
const { makeSkill } = require("./skill");
const { makeSystemMessage } = require("../../source/shared/message");

function minimalSetupAgent(agent)
{
    agent.message(
        makeSystemMessage({
            content: `
# SYSTEM: Abytek.AIAgent Framework

You are an AI agent running inside the Abytek.AIAgent Framework.

The framework enables multiple AI agents to collaborate together as a distributed agent system.

Framework root path:
${path.normalize(path.join(__dirname, ".."))}

# CORE CONCEPTS

## Root
The root is the central server that manages AI agents.

Responsibilities:
- managing agents
- agent communication
- coordination
- runtime management

## Runtime
A runtime is a manager that manages runtime-side of agents in an OS,...

Responsibilities:
- managing skills, agent spawning, implementation,...

## AI Agent
An AI agent is NOT just a language model.

An AI agent is:
- a Node.js runtime
- a software project
- an autonomous execution unit
- capable of tool usage and inter-agent collaboration

Each AI agent:
- has a unique string ID
- has its own runtime environment
- can communicate with other agents through tools

# INTER-AGENT COMMUNICATION RULES

IMPORTANT:
You NEVER communicate with other agents directly in normal text output.

ALL inter-agent communication MUST happen through provided tools.

When you are waiting for other agent responses for too long, please SEND FOLLOWING MESSAGE TO THEM.

Do NOT:
- simulate another agent response
- pretend another agent replied
- hallucinate agent communication
- roleplay inter-agent messaging

Only tools are allowed to perform agent communication.

# TOOL USAGE RULES

Tools are the primary execution mechanism.

When solving tasks:
- prefer tools over assumptions
- prefer execution over guessing
- prefer verification over hallucination

If an exact tool does not exist:
- think about combining existing tools
- reuse available system capabilities
- decompose the task into smaller executable steps

# EXECUTION RULES

You should:
- perform concrete actions when needed
- avoid unnecessary reasoning without execution
- keep actions focused and efficient

You must NOT:
- invent tool results
- invent filesystem state
- invent command outputs
- invent agent responses

# RESPONSE STYLE

Be:
- precise
- execution-oriented
- tool-oriented
- concise

Avoid:
- excessive narration
- unnecessary explanations
- pretending actions were executed when they were not
            `,
        })
    );
    agent.message(
        makeSystemMessage(`
# AGENT IDENTITY

You are a runtime AI agent instance.

## Current Agent Information

Agent ID:
${agent.id}

Agent Project Path:
${agent.path}

Agent Brief:
${agent.brief}

Agent Tags:
${agent.tags}

## Runtime Environment

Process ID:
${process.pid}

Platform:
${process.platform}

## IMPORTANT BEHAVIOR RULES

You are an autonomous execution agent.

Your responsibilities may include:
- executing tasks
- inspecting project files
- debugging
- coordination
- delegating subtasks
- using tools effectively

You should actively use available tools when necessary.

Do NOT:
- wait for tools if execution is clearly required
- fabricate execution results
- pretend to access unavailable information

If another agent is better suited:
- communicate through agent communication tools
- delegate the task clearly
        `)
    );
}

function createAgentSkillManager(agent)
{
    const agentSkillManager = makeEventEmitter({
        agent,
        skills: new Map(),
        sortedSkills: [],
    });
    agentSkillManager.has = function(skillName)
    {
        return agentSkillManager.skills.has(skillName);
    }
    agentSkillManager.find = function(skillName)
    {
        if (!agentSkillManager.has(skillName))
        {
            return null;
        }
        return agentSkillManager.skills.find(skillName);
    }
    agentSkillManager.get = function(skillName)
    {
        if (!agentSkillManager.has(skillName))
        {
            throw new Error(`Not found skill with name: ${skillName}`);
        }
        return agentSkillManager.skills.get(skillName);
    }

    function importSkills()
    {
        for (const skillReference of agent.skillReferences)
        {
            const skillImportFunction = require(path.resolve(skillReference.path, "skill.js"));
            const skill = makeSkill(agent, skillReference);
            skillImportFunction(skill);
            if (skill.name == null)
            {
                throw new Error(`Skill at ${skillReference.path} has name of null`);
            }
            if (agentSkillManager.has(skill.name))
            {
                throw new Error(`Already added skill with name: ${skill.name}`);
            }
            agentSkillManager.skills.set(skill.name, skill);
            agent.logger.log([ chalk.rgb(60, 200, 30)("Skill") ], `Imported skill: ${chalk.rgb(100, 150, 250)(skill.name)}`);
        }
    }
    function sortSkills()
    {
        const visited = new Set();
        const visiting = new Set();
        const sorted = [];

        function visit(skill)
        {
            if (visited.has(skill.name))
            {
                return;
            }

            if (visiting.has(skill.name))
            {
                throw new Error(`Circular dependency detected at skill: ${skill.name}`);
            }

            visiting.add(skill.name);

            const dependencies = skill.dependencies || [];
            for (const dependencyName of dependencies)
            {
                const dependency = agentSkillManager.skills.get(dependencyName);

                if (dependency == null)
                {
                    throw new Error(
                        `Skill "${skill.name}" depends on missing skill "${dependencyName}"`
                    );
                }

                visit(dependency);
            }

            visiting.delete(skill.name);
            visited.add(skill.name);

            sorted.push(skill);
        }

        for (const skill of agentSkillManager.skills.values())
        {
            visit(skill);
        }

        agentSkillManager.sortedSkills = sorted;
    };
    function resolveTags()
    {
        const tagDefinitions = new Map();

        // Gather all tag definitions from skills
        for (const skill of agentSkillManager.skills.values())
        {
            for (const tag of skill.tags.values())
            {
                if (tagDefinitions.has(tag.name))
                {
                    throw new Error(
                        `Duplicate tag definition: ${tag.name}`
                    );
                }

                tagDefinitions.set(tag.name, tag);
            }
        }

        const resolved = new Set();
        const visiting = new Set();

        function visit(tagName)
        {
            if (resolved.has(tagName))
            {
                return;
            }

            if (visiting.has(tagName))
            {
                throw new Error(
                    `Circular tag dependency detected: ${tagName}`
                );
            }

            const tag = tagDefinitions.get(tagName);

            if (tag == null)
            {
                throw new Error(
                    `Unknown tag: ${tagName}`
                );
            }

            visiting.add(tagName);

            for (const dependency of tag.dependencies)
            {
                visit(dependency);
            }

            visiting.delete(tagName);

            resolved.add(tagName);
        }

        for (const tagName of agent.tags)
        {
            visit(tagName);
        }

        agent.tags = Array.from(resolved);
        agent.logger.log([ chalk.rgb(60, 200, 30)("Skill") ], `Resolved tags:`, agent.tags);
    };
    
    //
    importSkills();
    sortSkills();
    doSync(async () => {
        // add skill's items (tags,...)
        for (const skill of agentSkillManager.sortedSkills)
        {
            await skill.emit("construct");
        }
    });
    resolveTags();
    minimalSetupAgent(agent);
    doSync(async () => {
        for (const skill of agentSkillManager.sortedSkills)
        {
            await skill.emit("setup");
        }
    });

    // agent events
    agent.on(
        "init",
        async () => {
            for (const skill of agentSkillManager.sortedSkills)
            {
                await skill.emit("init");
            }
        }
    );
    agent.on(
        "ready",
        async () => {
            for (const skill of agentSkillManager.sortedSkills)
            {
                await skill.emit("ready");
            }
        }
    );
    agent.on(
        "ready",
        async () => {
            for (const skill of agentSkillManager.sortedSkills)
            {
                await skill.emit("ready");
            }
        }
    );
    agent.on(
        "release",
        async () => {
            for (const skill of agentSkillManager.sortedSkills)
            {
                await skill.emitReversed("release");
            }
        }
    );
    return agentSkillManager;
}

module.exports = {
    createAgentSkillManager
};