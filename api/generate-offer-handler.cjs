/**
 * Generate Offer Endpoint (CommonJS)
 * Version: 7.0.4-patch-4.3.6
 */

const applyCors = require("./lib/cors.cjs");

// Import libraries
const workTasksDB = require("./lib/work-tasks-database.cjs");
const materialsDB = require("./lib/materials-database.cjs");
const rentalItemsDB = require("./lib/rental-items-database.cjs");
const standardCatalog = require("./lib/standard-catalog.cjs");
const fewShotDB = require("./lib/few-shot-database.cjs");
const { formatOfferOutput } = require("./lib/offer-utils.cjs");
const hourlyRates = require("./lib/hourly-rates.cjs");
const reverseChargeUtils = require("./lib/reverse-charge-utils.cjs");
const offerConstants = require("./lib/offer-constants.cjs");

// AI utilities
const aiDatabaseSearch = require("./lib/ai-database-search.cjs");
const aiProcessOntology = require("./lib/ai-process-ontology.cjs");
const aiTwoPassSchema = require("./lib/ai-two-pass-schema.cjs");
const aiValidatorPolicy = require("./lib/ai-validator-policy.cjs");
const advancedOfferAnalyzer = require("./lib/advanced-offer-analyzer.cjs");
const offerLearning = require("./lib/offer-learning.cjs");

module.exports = async function handler(req, res) {
  if (applyCors(req, res)) {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { projectDescription } = req.body;

    if (!projectDescription) {
      return res.status(400).json({ error: "projectDescription is required" });
    }

    // Feature flags
    const USE_FEWSHOT = process.env.USE_FEWSHOT === "true";
    const USE_AI_SEARCH = process.env.USE_AI_SEARCH === "true";
    const USE_ONTOLOGY = process.env.USE_ONTOLOGY === "true";
    const USE_TWO_PASS = process.env.USE_TWO_PASS === "true";
    const USE_VALIDATOR = process.env.USE_VALIDATOR === "true";
    const USE_ADVANCED_ANALYZER = process.env.USE_ADVANCED_ANALYZER === "true";
    const USE_LEARNING_SYSTEM = process.env.USE_LEARNING_SYSTEM === "true";

    // Step 1: Ontology
    let processedDescription = projectDescription;
    let ontologyMetadata = null;

    if (USE_ONTOLOGY) {
      const ontologyResult = await aiProcessOntology.processOntology(projectDescription);
      processedDescription = ontologyResult.enrichedDescription;
      ontologyMetadata = ontologyResult.metadata;
    }

    // Step 2: DB search
    let searchResults = null;
    if (USE_AI_SEARCH) {
      searchResults = await aiDatabaseSearch.searchDatabases(
        processedDescription,
        { workTasksDB, materialsDB, rentalItemsDB }
      );
    }

    // Step 3: Prompt
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

    // Step 4: Two-pass schema
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

    // Step 5: Validator
    if (USE_VALIDATOR) {
      const validation = await aiValidatorPolicy.validateOffer(offerData);
      if (!validation.isValid) {
        console.warn("[generate-offer] Validation warnings:", validation.warnings);
      }
    }

    // Step 6: Advanced analyzer
    if (USE_ADVANCED_ANALYZER) {
      const analysis = await advancedOfferAnalyzer.analyzeOffer(offerData);
      offerData.qualityMetrics = analysis.metrics;
      offerData.qualityScore = analysis.score;
    }

    // Step 7: Learning
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
      version: "7.0.4-patch-4.3.6",
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
      version: "7.0.4-patch-4.3.6"
    });
  }
};
