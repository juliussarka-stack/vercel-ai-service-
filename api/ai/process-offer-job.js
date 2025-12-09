const applyCors = require("../lib/cors.cjs");

module.exports = async (req, res) => {
  if (applyCors(req, res)) return res.status(204).end();
  const handler = require("./process-offer-job-handler.cjs"); // lazy-load
  return handler(req, res);
};
