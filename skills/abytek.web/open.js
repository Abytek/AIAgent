const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const cheerio = require("cheerio");
const pdfParse = require("pdf-parse");

async function webOpen({ url })
{
    const response = await fetch(url);

    const contentType =
        response.headers.get("content-type") || "";

    const buffer =
        Buffer.from(await response.arrayBuffer());

    const meta = {
        contentType,
        status: response.status
    };

    // -------------------------
    // PDF
    // -------------------------
    if (
        contentType.includes("pdf") ||
        url.endsWith(".pdf")
    )
    {
        const pdf =
            await pdfParse(buffer);

        return {
            url,
            type: "pdf",
            title: null,
            content: pdf.text,
            links: [],
            meta
        };
    }

    // -------------------------
    // HTML
    // -------------------------
    if (
        contentType.includes("text/html")
    )
    {
        const html =
            buffer.toString("utf-8");

        const $ =
            cheerio.load(html);

        const title =
            $("title").text().trim() || null;

        const links =
            $("a[href]")
                .map((_, el) =>
                    $(el).attr("href")
                )
                .get()
                .filter(Boolean);

        // fallback simple text extraction
        const content =
            $("body").text().replace(/\s+/g, " ").trim();

        return {
            url,
            type: "html",
            title,
            content,
            links,
            meta
        };
    }

    // -------------------------
    // TEXT / MARKDOWN
    // -------------------------
    if (
        contentType.includes("text/plain") ||
        contentType.includes("markdown")
    )
    {
        return {
            url,
            type: "text",
            title: null,
            content: buffer.toString("utf-8"),
            links: [],
            meta
        };
    }

    // -------------------------
    // UNKNOWN
    // -------------------------
    return {
        url,
        type: "unknown",
        title: null,
        content: buffer.toString("utf-8"),
        links: [],
        meta
    };
}

function importOpen(skill)
{
    const agent = skill.agent;

    skill.on(
        "setup",
        async () => {

            agent.tool(
                tool(
                    async ({
                        url,
                    }) => {
                        try
                        {
                            return JSON.stringify(
                                    await webOpen({ url }), 
                                    null, 
                                    4
                                );
                        }
                        catch (err)
                        {
                            return `Failed to search: ${err.message}`;
                        }
                    },
                    {
                        name: "web_open",

                        description:
                            "Open web by url. Prefer using web_open to using terminal for opening websites, website URLs,...",

                        schema: z.object({

                            url: z
                                .string()
                                .describe(
                                    "url."
                                ),
                        }),
                    }
                )
            );
        }
    );
}

module.exports = {
    importOpen,
};