/**
 * Create Offer Job Endpoint (CommonJS)
 * Version: 7.0.4-patch-4.3.5 (CORS fix)
 * 
 * Creates an async job for offer generation.
 * Returns jobId immediately, client polls for status.
 */

const applyCors = require("../lib/cors.cjs");
const { createSupabaseClient } = require("../lib/supabase.cjs");

module.exports = async function handler(req, res) {
  // ✅ PATCH 4.3.5: CORS handling
  if (applyCors(req, res)) {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { projectDescription, metadata = {} } = req.body;

    if (!projectDescription) {
      return res.status(400).json({ error: "projectDescription is required" });
    }

    const supabase = createSupabaseClient();

    // Create job record
    const { data: job, error: dbError } = await supabase
      .from("offer_jobs")
      .insert({
        status: "pending",
        input: { projectDescription, metadata },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Trigger async processing (fire and forget)
    const processUrl = `${process.env.VERCEL_URL || req.headers.host}/api/ai/process-offer-job`;
    const jobSecret = process.env.JOB_SECRET;

    fetch(processUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-job-secret": jobSecret
      },
      body: JSON.stringify({ jobId: job.id })
    }).catch(err => {
      console.error("[create-offer-job] Failed to trigger processing:", err);
    });

    return res.status(202).json({
      success: true,
      jobId: job.id,
      status: "pending",
      version: "7.0.4-patch-4.3.5",
      pollUrl: `/api/ai/job-status/${job.id}`
    });
  } catch (error) {
    console.error("[create-offer-job.cjs] Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
      version: "7.0.4-patch-4.3.5"
    });
  }
};
