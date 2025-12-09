/**
 * Job Status Endpoint (CommonJS)
 * Version: 7.0.4-patch-4.3.6
 */

const applyCors = require("../../lib/cors.cjs");
const { createSupabaseClient } = require("../../lib/supabase.cjs");

module.exports = async function handler(req, res) {
  if (applyCors(req, res)) {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const jobId = req.query?.jobId || req.url?.split("/").pop();
    if (!jobId) {
      return res.status(400).json({ error: "jobId is required" });
    }

    const supabase = createSupabaseClient();

    const { data: job, error: dbError } = await supabase
      .from("offer_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (dbError || !job) {
      return res.status(404).json({
        error: "Job not found",
        jobId,
        version: "7.0.4-patch-4.3.6"
      });
    }

    const response = {
      jobId: job.id,
      status: job.status,
      version: "7.0.4-patch-4.3.6",
      createdAt: job.created_at,
      updatedAt: job.updated_at
    };

    if (job.status === "completed") {
      response.result = job.result;
    } else if (job.status === "failed") {
      response.error = job.error;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("[job-status-handler.cjs] Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
      version: "7.0.4-patch-4.3.6"
    });
  }
};
