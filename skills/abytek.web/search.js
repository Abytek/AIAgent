const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const cheerio = require("cheerio");

async function searchDuckDuckGo(
    query,
    numResultsPerPage = 10,
    pageIndex = 0
)
{
    const response = await fetch(
        "https://html.duckduckgo.com/html/",
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded",
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"
            },
            body:
                `q=${encodeURIComponent(query)}`
        }
    );

    if (!response.ok)
    {
        throw new Error(
            `HTTP ${response.status}`
        );
    }

    const html =
        await response.text();

    const $ =
        cheerio.load(html);

    const allResults = [];

    $(".result").each((_, element) => {

        const title =
            $(element)
                .find(".result__title a")
                .text()
                .trim();

        const url =
            $(element)
                .find(".result__title a")
                .attr("href");

        const snippet =
            $(element)
                .find(".result__snippet")
                .text()
                .trim();

        if (
            title &&
            url
        )
        {
            allResults.push({
                title,
                url,
                snippet
            });
        }
    });

    const start =
        pageIndex *
        numResultsPerPage;

    return {
        query,
        pageIndex,
        numResultsPerPage,

        hasMore:
            allResults.length >
            start +
            numResultsPerPage,

        results:
            allResults.slice(
                start,
                start +
                numResultsPerPage
            )
    };
}

function importSearch(skill)
{
    const agent = skill.agent;

    skill.on(
        "setup",
        async () => {

            agent.tool(
                tool(
                    async ({
                        query,
                        numResultsPerPage,
                        pageIndex
                    }) => {

                        try
                        {
                            return await searchDuckDuckGo(
                                query,
                                numResultsPerPage,
                                pageIndex
                            );
                        }
                        catch (err)
                        {
                            return `Failed to search: ${err.message}`;
                        }
                    },
                    {
                        name: "web_search",

                        description:
                            "Search web using DuckDuckGo.",

                        schema: z.object({

                            query: z
                                .string()
                                .describe(
                                    "Search query."
                                ),

                            numResultsPerPage: z
                                .number()
                                .optional()
                                .default(10)
                                .describe(
                                    "Number of results per page."
                                ),

                            pageIndex: z
                                .number()
                                .optional()
                                .default(0)
                                .describe(
                                    "Page index starting at 0."
                                ),
                        }),
                    }
                )
            );
        }
    );
}

module.exports = {
    importSearch,
};