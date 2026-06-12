
const { tool } = require("@langchain/core/tools");
const { z } = require("zod");

const SEARXNG_PUBLIC_SERVERS = [
  'https://searxng.website/',
  'https://searx.perennialte.ch/',
  'https://search.pi.vps.pw/',
  'https://searx.oloke.xyz/',
  'https://searxng.shreven.org/',
  'https://search.einfachzocken.eu/',
  'https://search.ctq.ro/',
  'https://searxng.canine.tools/',
  'https://search.undertale.uk/',
  'https://search.rhscz.eu/',
];

async function webSearchTool(
    query,
    numResultsPerPage = 10,
    pageIndex = 0
)
{
    const activeServers =
        [...SEARXNG_PUBLIC_SERVERS]
            .sort(() => Math.random() - 0.5);

    for (const server of activeServers)
    {
        try
        {
            const controller =
                new AbortController();

            const timeoutId =
                setTimeout(
                    () => controller.abort(),
                    3000
                );

            const url =
                `${server}?` +
                new URLSearchParams({
                    q: query,
                    format: "json",
                    pageno: String(
                        pageIndex + 1
                    )
                });

            const response =
                await fetch(
                    url,
                    {
                        signal:
                            controller.signal,
                        headers:
                        {
                            "User-Agent":
                                "Mozilla/5.0"
                        }
                    }
                );

            clearTimeout(
                timeoutId
            );

            if (!response.ok)
            {
                continue;
            }

            const data =
                await response.json();

            if (
                !data ||
                !Array.isArray(
                    data.results
                )
            )
            {
                continue;
            }

            return {
                query,
                pageIndex,
                numResultsPerPage,

                provider:
                    server,

                hasMore:
                    data.results.length >=
                    numResultsPerPage,

                results:
                    data.results
                        .slice(
                            0,
                            numResultsPerPage
                        )
                        .map(
                            (
                                item,
                                index
                            ) => ({
                                rank:
                                    pageIndex *
                                    numResultsPerPage +
                                    index +
                                    1,

                                title:
                                    item.title ??
                                    "",

                                url:
                                    item.url ??
                                    "",

                                snippet:
                                    item.content ??
                                    item.snippet ??
                                    ""
                            })
                        )
            };
        }
        catch (err)
        {
            console.warn(
                `[WebSearch] ${server} failed`
            );
        }
    }

    return {
        query,
        pageIndex,
        numResultsPerPage,

        provider: null,

        hasMore: false,

        results: []
    };
}async function webSearchTool(
    query,
    numResultsPerPage = 10,
    pageIndex = 0
)
{
    const activeServers =
        [...SEARXNG_PUBLIC_SERVERS]
            .sort(() => Math.random() - 0.5);

    for (const server of activeServers)
    {
        try
        {
            const controller =
                new AbortController();

            const timeoutId =
                setTimeout(
                    () => controller.abort(),
                    3000
                );

            const url =
                `${server}?` +
                new URLSearchParams({
                    q: query,
                    format: "json",
                    pageno: String(
                        pageIndex + 1
                    )
                });

            const response =
                await fetch(
                    url,
                    {
                        signal:
                            controller.signal,
                        headers:
                        {
                            "User-Agent":
                                "Mozilla/5.0"
                        }
                    }
                );

            clearTimeout(
                timeoutId
            );

            if (!response.ok)
            {
                continue;
            }

            const data =
                await response.json();

            if (
                !data ||
                !Array.isArray(
                    data.results
                )
            )
            {
                continue;
            }

            return {
                query,
                pageIndex,
                numResultsPerPage,

                provider:
                    server,

                hasMore:
                    data.results.length >=
                    numResultsPerPage,

                results:
                    data.results
                        .slice(
                            0,
                            numResultsPerPage
                        )
                        .map(
                            (
                                item,
                                index
                            ) => ({
                                rank:
                                    pageIndex *
                                    numResultsPerPage +
                                    index +
                                    1,

                                title:
                                    item.title ??
                                    "",

                                url:
                                    item.url ??
                                    "",

                                snippet:
                                    item.content ??
                                    item.snippet ??
                                    ""
                            })
                        )
            };
        }
        catch (err)
        {
            console.warn(
                `[WebSearch] ${server} failed`
            );
        }
    }

    return {
        query,
        pageIndex,
        numResultsPerPage,

        provider: null,

        hasMore: false,

        results: []
    };
}async function webSearchTool(
    query,
    numResultsPerPage = 10,
    pageIndex = 0
)
{
    const activeServers =
        [...SEARXNG_PUBLIC_SERVERS]
            .sort(() => Math.random() - 0.5);

    for (const server of activeServers)
    {
        try
        {
            const controller =
                new AbortController();

            const timeoutId =
                setTimeout(
                    () => controller.abort(),
                    3000
                );

            const url =
                `${server}?` +
                new URLSearchParams({
                    q: query,
                    format: "json",
                    pageno: String(
                        pageIndex + 1
                    )
                });

            const response =
                await fetch(
                    url,
                    {
                        signal:
                            controller.signal,
                        headers:
                        {
                            "User-Agent":
                                "Mozilla/5.0"
                        }
                    }
                );

            clearTimeout(
                timeoutId
            );

            if (!response.ok)
            {
                continue;
            }

            const data =
                await response.json();

            if (
                !data ||
                !Array.isArray(
                    data.results
                )
            )
            {
                continue;
            }

            return {
                query,
                pageIndex,
                numResultsPerPage,

                provider:
                    server,

                hasMore:
                    data.results.length >=
                    numResultsPerPage,

                results:
                    data.results
                        .slice(
                            0,
                            numResultsPerPage
                        )
                        .map(
                            (
                                item,
                                index
                            ) => ({
                                rank:
                                    pageIndex *
                                    numResultsPerPage +
                                    index +
                                    1,

                                title:
                                    item.title ??
                                    "",

                                url:
                                    item.url ??
                                    "",

                                snippet:
                                    item.content ??
                                    item.snippet ??
                                    ""
                            })
                        )
            };
        }
        catch (err)
        {
            console.warn(
                `[WebSearch] ${server} failed`
            );
        }
    }

    return {
        query,
        pageIndex,
        numResultsPerPage,

        provider: null,

        hasMore: false,

        results: []
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
                    async ({ query, numResultsPerPage, pageIndex }) => {
                        try
                        {
                            return await webSearchTool(query, numResultsPerPage, pageIndex);
                        }
                        catch(err)
                        {
                            return `Failed to search: ${err.message}`;
                        }
                    },
                    {
                        name: "web_search",
                        description:
                            [
                                "Web search.",
                            ].join("\n"),
                        schema: z.object({
                            query: z
                                .string()
                                .describe(
                                    [
                                        "Query for searching",
                                    ].join(" ")
                                ),
                            numResultsPerPage: z
                                .string()
                                .optional()
                                .describe(
                                    [
                                        "Num results per page",
                                    ].join(" ")
                                )
                                .default(10),
                            pageIndex: z
                                .string()
                                .optional()
                                .describe(
                                    [
                                        "pageIndex",
                                    ].join(" ")
                                )
                                .default(0),
                        }),
                    }
                )
            );
        }
    );
}

module.exports = {
    importSearch,
}