
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const chalk = require("chalk");
const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { makeEventEmitter } = require("../utilities/eventEmitter");
const { 
    makeAIMessage,
    makeHumanMessage,
    makeSystemMessage,
    getMessageRole,
    getMessageContent,
    getMessageContentLength,
} = require("../shared/message");

const MAX_MESSAGE_CHARACTERS = (
    4000 
    + 300 // padding
);

function getTextAttachmentContentAsText(content)
{
    if (typeof content === "string")
    {
        return content;
    }

    if (Array.isArray(content))
    {
        return content
            .filter(
                item =>
                    item
                    && item.type === "text"
                    && typeof item.text === "string"
            )
            .map(item => item.text)
            .join("\n");
    }

    return "";
}

function importTextAttachmentTools(agentContext)
{
    const agent = agentContext.agent;

    const MAX_CHUNK_CHARS = 2000;

    agent.tool(
        tool(
            async ({ id, chunk_offset, chunk_size }) => {

                if (agentContext.textAttachments.has(id))
                {
                    const textAttachment = agentContext.textAttachments[id];
                    if (chunk_offset > textAttachment.textContent.length)
                    {
                        return `[${id}] chunk_offset (${chunk_offset}) out of bounds, current textAttachment content length: ${textAttachment.textContent.length}`;
                    }
                    const end_chunk_offset = Math.min(
                        chunk_offset + chunk_size,
                        textAttachment.textContent.length
                    );
                    const real_chunk_size = end_chunk_offset - chunk_offset;
                    const contentChunk = textAttachment.textContent.slice(chunk_offset, end_chunk_offset);
                    return `[${id}] [Text content size: ${textAttachment.textContent.length}] [Text content chunk: offset=${chunk_offset}, size=${real_chunk_size}]\n${contentChunk}`;
                }
                else
                {
                    return `Not found text attachment with id: ${id}`;
                }
            },
            {
                name: "read_text_attachment",

                description:
                    [
                        "Read text attachment by text attachment id and chunk range",
                    ].join("\n"),

                schema: z.object({
                    id: z
                        .string()
                        .describe(
                            [
                                "The text attachment id."
                            ].join(" ")
                        ),
                    chunk_offset: z
                        .number()
                        .describe(
                            [
                                "The chunk offset to read."
                            ].join(" ")
                        ),
                    chunk_size: z
                        .number()
                        .min(1)
                        .max(MAX_CHUNK_CHARS)
                        .describe(
                            [
                                `The chunk size to read`
                            ].join(" ")
                        ),
                }),
            }
        )
    );
}

function createAgentLLMContext(agent)
{
    const agentContextDirectory = path.resolve(agent.dataDirectory, "agentContexts");
    fs.mkdirSync(agentContextDirectory, { recursive: true });

    const initialDate = new Date();

    const agentContext = makeEventEmitter({
        agent,
        messages: [],
        textAttachments: new Map(),
        memory: [],
        file: path.resolve(agentContextDirectory, initialDate.toISOString().replaceAll(":", ".") + ".json"),
    });

    agentContext.loadMemory = function()
    {
        agentContext.memory.length = 0;

        const fileNames = fs
            .readdirSync(agentContextDirectory)
            .filter(fileName => fileName.endsWith(".json"))
            .sort();

        for (const fileName of fileNames)
        {
            const filePath = path.resolve(
                agentContextDirectory,
                fileName
            );

            try
            {
                const contextData = JSON.parse(
                    fs.readFileSync(filePath, "utf8")
                );
                agentContext.memory.push(contextData);

                for (const textAttachment of contextData.textAttachments)
                {
                    agentContext.textAttachments.set(textAttachment.id, textAttachment);
                }

                agent.logger.log([ chalk.rgb(60, 200, 30)("LLM Context") ], `Loaded memory:`, filePath);
            }
            catch (error)
            {
                agent.logger.log([ chalk.rgb(60, 200, 30)("LLM Context"), chalk.rgb(200, 150, 30)("Warn") ], `Failed to load memory:`, filePath);
            }
        }
    }
    agentContext.save = function()
    {
        const dataToSave = {
            initialDate: initialDate,
            messages: agentContext.messages,
            textAttachments: Array.from(agentContext.textAttachments.values()),
        };
        fs.writeFileSync(agentContext.file, JSON.stringify(dataToSave, null, 4));
    }
    agentContext.inputMessage = function(message) 
    {
        const messageContent = getMessageContent(message);
        if (getMessageContentLength(messageContent) > MAX_MESSAGE_CHARACTERS)
        {
            const messageRole = getMessageRole(message);

            const hash = crypto
                .createHash("sha1")
                .update(
                    agent.id
                    + "|" + Date.now()
                    + "|" + agentContext.textAttachments.size
                )
                .digest("hex")
                .slice(0, 8);

            const textAttachmentId = `LocalTextAttachment@${hash}`;

            agentContext.textAttachments.set(
                textAttachmentId,
                {
                    id: textAttachmentId,
                    createdAt: new Date().toISOString(),
                    content: messageContent,
                    text: getTextAttachmentContentAsText(messageContent),
                }
            );

            const attachmentMessage = {
                type: messageRole,
                content: [
                        `[Text Attachment Id: ${textAttachmentId}] [Original content length: ${getMessageContentLength(messageContent)}]\n`,
                        messageContent.slice(0, MAX_MESSAGE_CHARACTERS),
                    ].join(''),
            };

            agentContext.messages.push(attachmentMessage);
        }
        else
        {
            agentContext.messages.push(message);
        }
        agentContext.save();
    }
    agentContext.outputMessage = function(message) 
    {
        agentContext.messages.push(message);
        agentContext.save();
    }

    //
    agentContext.loadMemory();

    //
    importTextAttachmentTools(agentContext);
    return agentContext;
}

module.exports = {
    createAgentLLMContext
};