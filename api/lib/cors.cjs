/**
 * CORS Helper for Vercel Serverless Functions
 * Version: 7.0.4-patch-4.3.5
 * 
 * Handles preflight requests and sets CORS headers.
 * Explicitly allows x-job-secret for async job processing.
 * 
 * Usage:
 *   const applyCors = require("./lib/cors.cjs");
 *   module.exports = async (req, res) => {
 *     if (applyCors(req, res)) return res.status(204).end();
 *     // ... rest of handler logic
 *   };
 */

module.exports = function applyCors(req, res) {
  const origin = req.headers.origin;

  // Allowed origins - Webflow production and staging
  const allowedOrigins = [
    "https://gesa-company-ab.webflow.io",
    "https://gesa-company-ab.webflow.io/",
    "https://preview.webflow.com",
    "http://localhost:3000", // Local development
    "http://127.0.0.1:3000"
  ];

  // Check if origin is allowed, otherwise allow all (for flexibility)
  if (origin && allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // Fallback to wildcard for other origins (adjust if needed for security)
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  // Essential CORS headers
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  // ✅ PATCH 4.3.5: Explicitly allow x-job-secret for async job processing
  res.setHeader(
    "Access-Control-Allow-Headers", 
    "Content-Type, Authorization, X-Requested-With, x-job-secret"
  );

  res.setHeader("Access-Control-Max-Age", "86400"); // Cache preflight for 24 hours

  // Return true if this is a preflight request (should end with 204)
  return req.method === "OPTIONS";
};
