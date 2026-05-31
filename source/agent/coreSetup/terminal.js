const { tool } = require("@langchain/core/tools");
const { z } = require("zod");

function coreSetupTerminal(agent) {

    const terminals = {};

    agent.external.terminals = terminals;
}

module.exports = {
    coreSetupTerminal
}