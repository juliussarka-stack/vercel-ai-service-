/**
 * Generate Offer Handler (CommonJS)
 * Version: 7.0.4-patch-4.3.9
 *
 * NOTE: CORS is handled in the .js route files (4.3.8).
 * This handler should NOT depend on cors.cjs anymore.
 *//**
 * Generate Offer Handler (CommonJS)
 * Version: 7.0.4-patch-4.3.10
 *
 * CORS is handled in routes (4.3.8+).
 */

function reqMulti(basename) {
  const candidates = [
    `./lib/${basename}.cjs`,
    `./lib/${basename}.js`,
    `../src/lib/${basename}.cjs`,
    `../src/lib/${basename}.js`,
    `../src/lib/${basename}.ts`,
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
const { estimateHours } = reqMulti("work-time-estimates");
const hourlyRates = reqMulti("hourly-rates");
const reverseChargeUtils = reqMulti("reverse-charge-utils");
const offerConstants = reqMulti("offer-constants");

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

  try {
    const { projectDescription } = req_.body || {};

    if (!projectDescription) {
      return res.status(400).json({ error: "projectDescription is required" });
    }

    // Feature flags from environment
    const USE_FEWSHOT = process.env.USE_FEWSHOT === "true";
    const USE_AI_SEARCH = process.env.USE_AI_SEARCH === "true";
    const USE_ONTOLOGY = process.env.USE_ONTOLOGY === "true";
    const USE_TWO_PASS = process.env.USE_TWO_PASS === "true";
    const USE_VALIDATOR = process.env.USE_VALIDATOR === "true";
    const USE_ADVANCED_ANALYZER = process.env.USE_ADVANCED_ANALYZER === "true";
    const USE_LEARNING_SYSTEM = process.env.USE_LEARNING_SYSTEM === "true";

    // Step 1: Ontology processing (if enabled)
    let processedDescription = projectDescription;
    let ontologyMetadata = null;

    if (USE_ONTOLOGY) {
      const ontologyResult = await aiProcessOntology.processOntology(projectDescription);
      processedDescription = ontologyResult.enrichedDescription;
      ontologyMetadata = ontologyResult.metadata;
    }

    // Step 2: Database search (if enabled)
    let searchResults = null;

    if (USE_AI_SEARCH) {
      searchResults = await aiDatabaseSearch.searchDatabases(
        processedDescription,
        { workTasksDB, materialsDB, rentalItemsDB }
      );
    }

    // Step 3: Build prompt
    let systemPrompt = "Du är en expert på byggofferthantering.";
    let userPrompt = `Projekt: ${processedDescription}`;

    if (USE_FEWSHOT) {
      const examples = fewShotDB.getExamples();
      systemPrompt += `\n\nExempel:\n${JSON.stringify(examples, null, 2)}`;
    }

    if (searchResults) {
      userPrompt += `\n\nRelevanta arbetsmoment: ${JSON.stringify(searchResults.workTasks)}`;
      userPrompt += `\n\nRelevanta material: ${JSON.stringify(searchResults.materials)}`;
    }

    // Step 4: Two-pass schema validation (if enabled)
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

    // Step 5: Policy validation (if enabled)
    if (USE_VALIDATOR) {
      const validation = await aiValidatorPolicy.validateOffer(offerData);
      if (!validation.isValid) {
        console.warn("[generate-offer] Validation warnings:", validation.warnings);
      }
    }

    // Step 6: Advanced analysis (if enabled)
    if (USE_ADVANCED_ANALYZER) {
      const analysis = await advancedOfferAnalyzer.analyzeOffer(offerData);
      offerData.qualityMetrics = analysis.metrics;
      offerData.qualityScore = analysis.score;
    }

    // Step 7: Learning system (if enabled)
    if (USE_LEARNING_SYSTEM) {
      await offerLearning.learnFromOffer({
        projectDescription,
        offerData,
        metadata: { ontologyMetadata, searchResults }
      });
    }

    // Step 8: Format output
    const formattedOffer = formatOfferOutput(offerData);

    return res.status(200).json({
      success: true,
      version: "7.0.4-patch-4.3.9",
      offer: formattedOffer,
      metadata: {
        ontologyUsed: USE_ONTOLOGY,
        searchUsed: USE_AI_SEARCH,
        twoPassUsed: USE_TWO_PASS,
        validatorUsed: USE_VALIDATOR,
        analyzerUsed: USE_ADVANCED_ANALYZER,
        learningUsed: USE_LEARNING_SYSTEM
      }
    });
  } catch (error) {
    console.error("[generate-offer-handler.cjs] Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
      version: "7.0.4-patch-4.3.9"
    });
  }
};
