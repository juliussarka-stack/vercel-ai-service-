/**
 * CORS Test Endpoint (CommonJS)
 * Version: 7.0.4-patch-4.3.5 (CORS fix)
 * 
 * Simple endpoint to verify CORS headers are working correctly.
 */

const applyCors = require("./lib/cors.cjs");

module.exports = async function handler(req, res) {
  // ✅ PATCH 4.3.5: CORS handling
  if (applyCors(req, res)) {
    return res.status(204).end();
  }

  return res.status(200).json({
    message: "CORS test successful",
    version: "7.0.4-patch-4.3.5",
    timestamp: new Date().toISOString(),
    requestOrigin: req.headers.origin || "none",
    method: req.method
  });
};
