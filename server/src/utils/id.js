const crypto = require("node:crypto");

const createId = (prefix) => `${prefix}_${crypto.randomUUID()}`;

module.exports = {
  createId,
};
