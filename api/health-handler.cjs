/**
 * Health Check Endpoint (CommonJS)
 * Version: 7.0.4-patch-4.3.6
 */

const applyCors = require("./lib/cors.cjs");

module.exports = async function handler(req, res) {
  if (applyCors(req, res)) {
    return res.status(204).end();
  }

  try {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "7.0.4-patch-4.3.6",
      environment: process.env.VERCEL_ENV || "development",
      checks: {
        supabase: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY,
        openai: !!process.env.OPENAI_API_KEY,
        jobSecret: !!process.env.JOB_SECRET
      }
    };

    return res.status(200).json(health);
  } catch (error) {
    console.error("[health-handler.cjs] Error:", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
      version: "7.0.4-patch-4.3.6"
    });
  }
};
