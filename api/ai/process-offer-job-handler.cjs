/**
 * Process Offer Job Handler (CommonJS)
 * Version: 7.0.4-patch-4.3.9
 *
 * NOTE: CORS is handled in the .js route files (4.3.8).
 */
/**
 * Process Offer Job Handler (CommonJS)
 * Version: 7.0.4-patch-4.3.10
 *
 * CORS handled in routes.
 */

const { createSupabaseClient } = require("../lib/supabase.cjs");

function reqMulti(basename) {
  const candidates = [
    `../lib/${basename}.cjs`,
    `../lib/${basename}.js`,
    `../../src/lib/${basename}.cjs`,
    `../../src/lib/${basename}.js`,
    `../../src/lib/${basename}.ts`,
  ];
  for (const p of candidates) {
    try { return require(p); } catch (_) {}
  }
  throw new Error(`[reqMulti] Missing module for ${basename}. Tried:\n` + candidates.join("\n"));
}

const workTasksDB = reqMulti("work-tasks-database");
const materialsDB = reqMulti("materials-database");
const rentalItemsDB = reqMulti("rental-items-database");
const standardCatalog = reqMulti("standard-catalog");
const fewShotDB = reqMulti("few-shot-database");
const { formatOfferOutput } = reqMulti("offer-utils");

const aiDatabaseSearch = reqMulti("ai-database-search");
const aiProcessOntology = reqMulti("ai-process-ontology");
const aiTwoPassSchema = reqMulti("ai-two-pass-schema");
const aiValidatorPolicy = reqMulti("ai-validator-policy");
const advancedOfferAnalyzer = reqMulti("advanced-offer-analyzer");
const offerLearning = reqMulti("offer-learning");


module.exports = async function handler(req_, res) {
  if (req_.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const jobSecret = req_.headers["x-job-secret"];
  if (jobSecret !== process.env.JOB_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { jobId } = req_.body || {};
    if (!jobId) return res.status(400).json({ error: "jobId is required" });

    const supabase = createSupabaseClient();

    const { data: job, error: fetchError } = await supabase
      .from("offer_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (fetchError || !job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status === "completed" || job.status === "failed") {
      return res.status(200).json({
        message: "Job already processed",
        jobId,
        status: job.status
      });
    }

    await supabase
      .from("offer_jobs")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", jobId);

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
      version: "7.0.4-patch-4.3.9"
    });
  } catch (error) {
    console.error("[process-offer-job-handler.cjs] Error:", error);

    try {
      const supabase = createSupabaseClient();
      await supabase
        .from("offer_jobs")
        .update({
          status: "failed",
          error: error.message,
          updated_at: new Date().toISOString()
        })
        .eq("id", req_.body?.jobId);
    } catch (_) {}

    return res.status(500).json({
      error: "Processing failed",
      message: error.message,
      version: "7.0.4-patch-4.3.9"
    });
  }
};
