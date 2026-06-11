
const path = require("path");
const { makeSchema } = require("../utilities/schema");

const skillReferenceSchema = makeSchema({
    type: "object",

    properties: {
        path: {
            type: "string",
        },
    },

    required: [
        "path",
    ],
});

module.exports = {
    skillReferenceSchema,
}