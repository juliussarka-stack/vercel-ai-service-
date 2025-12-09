// api/test-cors.js
// Version: 7.0.4-patch-4.3.7-inline

function applyCors(req, res) {
  const origin = req.headers.origin;

  const allowedOrigins = [
    "https://gesa-company-ab.webflow.io",
    "https://gesa-company-ab-julius-projects-ccea11c8.webflow.io",
    "https://preview.webflow.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4321"
  ];

  if (origin && allowedOrigins.some(a => origin.startsWith(a.replace(/\/$/, "")))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, x-job-secret"
  );
  res.setHeader("Access-Control-Max-Age", "86400");

  return req.method === "OPTIONS";
}

module.exports = async (req, res) => {
  if (applyCors(req, res)) return res.status(204).end();

  const handler = require("./test-cors-handler.cjs");
  return handler(req, res);
};
