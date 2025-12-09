/**
 * Process Offer Job Endpoint (CommonJS)
 * Version: 7.0.4-patch-4.3.5 (CORS fix)
 * 
 * Internal endpoint that processes async offer jobs.
 * Protected by x-job-secret header.
 */

const applyCors = require("../lib/cors.cjs");
const { createSupabaseClient } = require("../lib/supabase.cjs");

// Import all libraries (same as generate-offer.cjs)
const workTasksDB = require("../lib/work-tasks-database.cjs");
const materialsDB = require("../lib/materials-database.cjs");
const rentalItemsDB = require("../lib/rental-items-database.cjs");
const standardCatalog = require("../lib/standard-catalog.cjs");
const fewShotDB = require("../lib/few-shot-database.cjs");
const { formatOfferOutput } = require("../lib/offer-utils.cjs");
const aiDatabaseSearch = require("../lib/ai-database-search.cjs");
const aiProcessOntology = require("../lib/ai-process-ontology.cjs");
const aiTwoPassSchema = require("../lib/ai-two-pass-schema.cjs");
const aiValidatorPolicy = require("../lib/ai-validator-policy.cjs");
const advancedOfferAnalyzer = require("../lib/advanced-offer-analyzer.cjs");
const offerLearning = require("../lib/offer-learning.cjs");

module.exports = async function handler(req, res) {
  // ✅ PATCH 4.3.5: CORS handling
  if (applyCors(req, res)) {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ✅ Authentication guard
  const jobSecret = req.headers["x-job-secret"];
  if (jobSecret !== process.env.JOB_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: "jobId is required" });
    }

    const supabase = createSupabaseClient();

    // Fetch job
    const { data: job, error: fetchError } = await supabase
      .from("offer_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (fetchError || !job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // ✅ Idempotency check
    if (job.status === "completed" || job.status === "failed") {
      return res.status(200).json({
        message: "Job already processed",
        jobId,
        status: job.status
      });
    }

    // Mark as processing
    await supabase
      .from("offer_jobs")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", jobId);

    // Process offer (same logic as generate-offer.cjs)
    const { projectDescription } = job.input;

    const USE_ONTOLOGY = process.env.USE_ONTOLOGY === "true";
    const USE_AI_SEARCH = process.env.USE_AI_SEARCH === "true";
    const USE_TWO_PASS = process.env.USE_TWO_PASS === "true";
    const USE_VALIDATOR = process.env.USE_VALIDATOR === "true";
    const USE_ADVANCED_ANALYZER = process.env.USE_ADVANCED_ANALYZER === "true";
    const USE_LEARNING_SYSTEM = process.env.USE_LEARNING_SYSTEM === "true";

    let processedDescription = projectDescription;
    let ontologyMetadata = null;

    if (USE_ONTOLOGY) {
      const result = await aiProcessOntology.processOntology(projectDescription);
      processedDescription = result.enrichedDescription;
      ontologyMetadata = result.metadata;
    }

    let searchResults = null;
    if (USE_AI_SEARCH) {
      searchResults = await aiDatabaseSearch.searchDatabases(processedDescription, {
        workTasksDB,
        materialsDB,
        rentalItemsDB
      });
    }

    let systemPrompt = "Du är en expert på byggofferthantering.";
    let userPrompt = `Projekt: ${processedDescription}`;

    let offerData;
    if (USE_TWO_PASS) {
      offerData = await aiTwoPassSchema.generateWithTwoPass({
        systemPrompt,
        userPrompt,
        ontologyMetadata
      });
    } else {
      offerData = {
        projectTitle: "Byggprojekt",
        rows: [],
        totals: { laborCost: 0, materialCost: 0, total: 0 }
      };
    }

    if (USE_VALIDATOR) {
      await aiValidatorPolicy.validateOffer(offerData);
    }

    if (USE_ADVANCED_ANALYZER) {
      const analysis = await advancedOfferAnalyzer.analyzeOffer(offerData);
      offerData.qualityMetrics = analysis.metrics;
      offerData.qualityScore = analysis.score;
    }

    if (USE_LEARNING_SYSTEM) {
      await offerLearning.learnFromOffer({
        projectDescription,
        offerData,
        metadata: { ontologyMetadata, searchResults }
      });
    }

    const formattedOffer = formatOfferOutput(offerData);

    // Update job as completed
    await supabase
      .from("offer_jobs")
      .update({
        status: "completed",
        result: formattedOffer,
        updated_at: new Date().toISOString()
      })
      .eq("id", jobId);

    return res.status(200).json({
      success: true,
      jobId,
      status: "completed",
      version: "7.0.4-patch-4.3.5"
    });
  } catch (error) {
    console.error("[process-offer-job.cjs] Error:", error);

    // Mark job as failed
    const supabase = createSupabaseClient();
    await supabase
      .from("offer_jobs")
      .update({
        status: "failed",
        error: error.message,
        updated_at: new Date().toISOString()
      })
      .eq("id", req.body.jobId);

    return res.status(500).json({
      error: "Processing failed",
      message: error.message,
      version: "7.0.4-patch-4.3.5"
    });
  }
};
