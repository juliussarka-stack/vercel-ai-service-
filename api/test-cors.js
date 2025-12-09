const applyCors = require("./lib/cors.cjs");
const handler = require("./test-cors-handler.cjs");

module.exports = async (req, res) => {
  if (applyCors(req, res)) return res.status(204).end();
  return handler(req, res);
};
