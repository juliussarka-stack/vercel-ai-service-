/**
 * CORS Test Endpoint (CommonJS)
 * Version: 7.0.4-patch-4.3.6
 */

const applyCors = require("./lib/cors.cjs");

module.exports = async function handler(req, res) {
  if (applyCors(req, res)) {
    return res.status(204).end();
  }

  return res.status(200).json({
    message: "CORS test successful",
    version: "7.0.4-patch-4.3.6",
    timestamp: new Date().toISOString(),
    requestOrigin: req.headers.origin || "none",
    method: req.method
  });
};
