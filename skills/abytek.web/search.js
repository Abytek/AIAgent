
const { tool } = require("@langchain/core/tools");
const { z } = require("zod");

const SEARXNG_PUBLIC_SERVERS = [
    "https://searxng.website/",
    "https://search.minus27315.dev/",
    "https://searx.perennialte.ch/",
    "https://search.pi.vps.pw/",
    "https://searx.oloke.xyz/",
    "https://searxng.shreven.org/",
    "https://search.einfachzocken.eu/",
    "https://search.ctq.ro/",
    "https://searxng.canine.tools/",
    "https://search.undertale.uk/",
    "https://search.rhscz.eu/",
    "https://searx.tiekoetter.com/",
    "https://searx.rhscz.eu/",
    "https://search.hbubli.cc/",
    "https://search.bladerunn.in/",
    "https://search.ononoki.org/",
    "https://priv.au/",
    "https://search.mdosch.de/",
    "https://www.gruble.de/",
    "https://searx.redgarden.cv/",
    "https://search.femboy.ad/",
    "https://searx.namejeff.xyz/",
    "https://search.seddens.net/",
    "https://grep.vim.wtf/",
    "https://search.wdpserver.com/",
    "https://search.maliffadlan.dev/",
    "https://search.sapti.me/",
    "https://searxng.cups.moe/",
    "https://searxng.wuemeli.com/",
    "https://searxng.fishfvch.com/",
    "https://search.privacyredirect.com/",
    "https://etsi.me/",
    "https://ooglester.com/",
    "https://search.chocolatemoo53.com/",
    "https://opnxng.com/",
    "https://searxng.gdebest.net/",
    "https://searxng.deggo.fyi/",
    "https://search.anoni.net/",
    "https://searx.sev.monster/",
    "https://search.unredacted.org/",
    "https://searxng.gr/",
    "https://search.liuzj.net/",
    "https://failsearx.culturanerd.it/",
    "https://baresearch.org/",
    "https://search.inetol.net/",
    "https://find.xenorio.xyz/",
    "https://kantan.cat/",
    "https://search.2b9t.xyz/",
    "https://search.catboy.house/",
    "https://search.ethibox.fr/",
    "https://search.im-in.space/",
    "https://search.indst.eu/",
    "https://search.internetsucks.net/",
    "https://search.pereira.is/",
    "https://search.rowie.at/",
    "https://search.serpensin.com/",
    "https://search.url4irl.com/",
    "https://search.zina.dev/",
    "https://searx.party/",
    "https://searx.tsmdt.de/",
    "https://searx.tuxcloud.net/",
    "https://searxng.site/",
    "https://searx.ro/",
    "https://searx.mxchange.org/",
    "https://searx.rajimayur.me/",
    "https://seek.fyi/",
    "https://searx.dresden.network/",
    "https://paulgo.io/",
];

async function webSearchTool(
    query,
    numResultsPerPage = 10,
    pageIndex = 0
)
{
    const activeServers =
        [...SEARXNG_PUBLIC_SERVERS]
            // .sort(() => Math.random() - 0.5);

    for (const server of activeServers)
    {
        try
        {
            const controller =
                new AbortController();

            const timeoutId =
                setTimeout(
                    () => controller.abort(),
                    4000
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
                                        "page index, started by 0.",
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