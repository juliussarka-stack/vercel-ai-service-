// api/generate-offer-stream.ts
// Version: 7.0.4-patch-4.3.5

// Importera CORS helpern (CJS)
const applyCors = require("./lib/cors.cjs");

export default async function handler(req: any, res: any) {
  // ✅ CORS + preflight
  if (applyCors(req, res)) {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ...din befintliga stream-logik här...
    // Viktigt: CORS-headers är redan satta innan streaming börjar.

  } catch (err: any) {
    console.error("[generate-offer-stream.ts] Error:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: err.message,
      version: "7.0.4-patch-4.3.5",
    });
  }
}
**
 * VERCEL AI OFFER GENERATION - STREAMING VERSION
 * Version: 2.0.0 - SSE/Streaming
 * 
 * STREAMING = NO TIMEOUT! 🎉
 * - Börjar returnera data inom 1-3 sekunder
 * - Cloudflare Workers kan passa igenom stream
 * - Ingen idle-timeout eftersom bytes kontinuerligt skickas
 * - Perfekt UX med realtid progress
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { Pass1Schema, getPass2Prompt, type ProjectPlan } from '../lib/ai-two-pass-schema.js';

export const config = {
  maxDuration: 60,
};

const STANDARD_HOURLY_RATE = 550;
const MODEL = 'gpt-4o-mini';

// ============================================================================
// SSE HELPERS
// ============================================================================

function sendSSE(res: VercelResponse, event: string, data: any) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ============================================================================
// PROMPTS (SAME AS ORIGINAL)
// ============================================================================

function getPass1Prompt(description: string): string {
  return `Du är en expert på byggprojektering och offertskrivning för svenska byggprojekt.

UPPDRAG: Analysera följande byggprojektbeskrivning och returnera strukturerad data enligt det strikt definierade schemat.

PROJEKTBESKRIVNING:
${description}

ANALYSERA:
1. **work_blocks**: Vilka byggfaser behövs? (välj från: forberedelse, mark, grund, stomme, tak, fasad, oppningar, invandig_stomme, ror, ytskikt, avslut)

2. **scope_tags**: Vad är projekttypen? (t.ex. takbyte_papp, fasad_panel_ny, tillbyggnad_tra_1plan)

3. **quantities**: Beräkna eller uppskatta areor och antal:
   - tak_area_m2, fasad_area_m2, golv_area_m2
   - antal_fönster, antal_dorrar
   - Ange null om ej relevant

4. **material_choices**: Välj lämpliga material baserat på svensk byggstandard

5. **reuse_items**: Vad kan återanvändas? (t.ex. takpannor, fönster, dorrar)

6. **risk_options**: Behövs byggställning, lift, container, etc?

7. **assumptions**: Lista antaganden (max 5)

8. **not_included**: Vad ingår INTE? (max 5)

9. **risk_level** (1-3): Projektets komplexitet
   - 1 = Enkelt, tydligt definierat
   - 2 = Medium, några osäkerheter
   - 3 = Komplext, många okända faktorer

10. **risk_percentage** (5-30%): Rekommenderad riskbuffert

Returnera valid JSON enligt schemat.`;
}

// ============================================================================
// HELPER FUNCTIONS (SAME AS ORIGINAL)
// ============================================================================

function scopeTagsToProjectTypes(scopeTags: string[]): string[] {
  const typeMap: Record<string, string> = {
    'takbyte_papp': 'Takbyte (papp)',
    'takbyte_plat': 'Takbyte (plåt)',
    'takbyte_tegel': 'Takbyte (tegel)',
    'tak_reparation': 'Takreparation',
    'fasad_panel_ny': 'Fasad (ny panel)',
    'fasad_panel_malning': 'Fasad (målning)',
    'fasad_puts_ny': 'Fasad (ny puts)',
    'fasad_puts_renovering': 'Fasadrenovering',
    'badrum_totalrenovering': 'Badrumsrenovering (total)',
    'badrum_delrenovering': 'Badrumsrenovering (del)',
    'kok_totalrenovering': 'Köksrenovering (total)',
    'kok_delrenovering': 'Köksrenovering (del)',
    'tillbyggnad_tra_1plan': 'Tillbyggnad (1 plan)',
    'tillbyggnad_tra_2plan': 'Tillbyggnad (2 plan)',
    'altan_tradack': 'Altan/Trädäck',
    'grund_platta': 'Grundläggning',
    'grund_plintar': 'Grundläggning',
    'renovering_generisk': 'Renovering'
  };
  return scopeTags.map(tag => typeMap[tag] || 'Renovering');
}

function generateProjectTitle(plan: ProjectPlan): string {
  const primaryTag = plan.scope_tags[0] || 'renovering_generisk';
  const area = plan.quantities.tak_area_m2 || 
               plan.quantities.fasad_area_m2 || 
               plan.quantities.golv_area_m2 || 
               0;

  const titleMap: Record<string, string> = {
    'takbyte_papp': 'Takbyte',
    'takbyte_plat': 'Takbyte plåt',
    'takbyte_tegel': 'Takbyte tegel',
    'tak_reparation': 'Takreparation',
    'fasad_panel_ny': 'Ny fasadpanel',
    'fasad_panel_malning': 'Fasadmålning',
    'fasad_puts_ny': 'Ny fasadputs',
    'fasad_puts_renovering': 'Fasadrenovering',
    'badrum_totalrenovering': 'Badrumsrenovering',
    'badrum_delrenovering': 'Badrumsrenovering',
    'kok_totalrenovering': 'Köksrenovering',
    'kok_delrenovering': 'Köksrenovering',
    'tillbyggnad_tra_1plan': 'Tillbyggnad',
    'tillbyggnad_tra_2plan': 'Tillbyggnad 2-plan',
    'altan_tradack': 'Altan',
    'grund_platta': 'Grundläggning',
    'grund_plintar': 'Grundläggning',
    'renovering_generisk': 'Renovering'
  };

  const baseTitle = titleMap[primaryTag] || 'Projekt';
  if (area > 0) return `${baseTitle} ${Math.round(area)} m²`;
  return baseTitle;
}

function generateProjectDescription(plan: ProjectPlan): string {
  const parts: string[] = [];
  const projectTypes = scopeTagsToProjectTypes(plan.scope_tags);
  parts.push(projectTypes[0]);

  if (plan.quantities.tak_area_m2) parts.push(`${Math.round(plan.quantities.tak_area_m2)} m² tak`);
  if (plan.quantities.fasad_area_m2) parts.push(`${Math.round(plan.quantities.fasad_area_m2)} m² fasad`);
  if (plan.quantities.golv_area_m2) parts.push(`${Math.round(plan.quantities.golv_area_m2)} m² golv`);
  if (plan.reuse_items && plan.reuse_items.length > 0) {
    parts.push(`Återanvänder: ${plan.reuse_items.join(', ')}`);
  }

  return parts.join('. ') + '.';
}

function parseTSV(tsv: string, plan: ProjectPlan) {
  const lines = tsv.split('\n').filter(line => line.trim() && !line.startsWith('//'));
  const workItems: any[] = [];
  const materialItems: any[] = [];
  const optionalItems: any[] = [];

  lines.forEach((line) => {
    const parts = line.split('\t').map(p => p.trim());
    if (parts.length < 6) return;

    const [kategori, , beskrivning, mangd, enhet, aPris, leverantor] = parts;
    const quantity = parseFloat(mangd) || 1;
    const unitPrice = parseInt(aPris) || 0;

    if (kategori === 'ARBETE') {
      workItems.push({ 
        description: beskrivning, 
        quantity, 
        unit: enhet, 
        unitPrice: STANDARD_HOURLY_RATE 
      });
    } else if (kategori === 'MATERIAL') {
      materialItems.push({ 
        description: beskrivning, 
        quantity, 
        unit: enhet, 
        unitPrice, 
        supplier: leverantor || 'TBD' 
      });
    } else if (kategori === 'HYRA') {
      optionalItems.push({ 
        description: beskrivning, 
        quantity, 
        unit: enhet, 
        unitPrice 
      });
    }
  });

  const workHours = workItems.reduce((sum, item) => sum + item.quantity, 0);
  const workCost = workItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const materialCost = materialItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const optionalCost = optionalItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return {
    projectTitle: generateProjectTitle(plan),
    projectType: scopeTagsToProjectTypes(plan.scope_tags),
    projectDescription: generateProjectDescription(plan),
    workItems,
    materialItems,
    optionalItems,
    assumptions: plan.assumptions || [],
    notIncludedItems: plan.not_included || [],
    riskAssessment: {
      level: plan.risk_level,
      percentage: plan.risk_percentage,
      reasoning: plan.risk_reasoning
    },
    totalEstimate: {
      workHours: Math.round(workHours * 10) / 10,
      workCost,
      materialCost,
      optionalCost,
      totalExclVat: workCost + materialCost + optionalCost
    }
  };
}

// ============================================================================
// MAIN HANDLER - STREAMING VERSION
// ============================================================================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
// 🔧 CORS FIX - Allow Webflow domains
const allowedOrigins = [
  'https://gesa-company-ab.webflow.io',
  'https://gesa-company-ab-julius-projects-ccea11c8.webflow.io',
  'http://localhost:4321',
  'http://localhost:3000'
];

const origin = req.headers.origin;
if (origin && allowedOrigins.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
}

res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  console.log('[Vercel AI Stream] 🚀 Starting streaming generation...');

  // 🔥 ENABLE STREAMING (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  try {
    const { description, projectType } = req.body;

    if (!description?.trim()) {
      sendSSE(res, 'error', { message: 'Beskrivning saknas' });
      return res.end();
    }

    // Send initial event (proves streaming works within 1s)
    sendSSE(res, 'progress', { 
      progress: 5, 
      phase: 'Startar AI-analys...', 
      elapsed_ms: Date.now() - startTime 
    });

    // Get environment variables
    const openaiKey = process.env.OPENAI_API_KEY;
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!openaiKey) {
      console.error('[Vercel AI Stream] ❌ Missing OPENAI_API_KEY');
      sendSSE(res, 'error', { message: 'Serverfel: Saknar OpenAI API-nyckel' });
      return res.end();
    }

    const openai = new OpenAI({ apiKey: openaiKey });

    // ========================================================================
    // PASS 1 - WITH PROGRESS UPDATES
    // ========================================================================

    sendSSE(res, 'progress', { 
      progress: 10, 
      phase: 'Analyserar projektbeskrivning...', 
      elapsed_ms: Date.now() - startTime 
    });

    console.log('[Vercel AI Stream] 🎯 Pass 1: Analyzing project...');
    const pass1Start = Date.now();

    const prompt1 = getPass1Prompt(description.trim());
    const seed = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
    const serializedSchema = JSON.parse(JSON.stringify(Pass1Schema));

    sendSSE(res, 'progress', { 
      progress: 15, 
      phase: 'Anropar OpenAI GPT-4...', 
      elapsed_ms: Date.now() - startTime 
    });

    const completion1 = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { 
          role: 'system', 
          content: 'Du är en expert på byggprojektering och offertskrivning för svenska byggprojekt. Du analyserar projekt noggrant och returnerar strukturerad, komplett data enligt schema.' 
        },
        { role: 'user', content: prompt1 }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'project_plan',
          strict: true,
          schema: serializedSchema
        }
      },
      temperature: 0.3,
      max_tokens: 3000,
      seed,
    });

    sendSSE(res, 'progress', { 
      progress: 40, 
      phase: 'Projektplan skapad!', 
      elapsed_ms: Date.now() - startTime 
    });

    const planJson = completion1.choices[0].message.content;
    if (!planJson) {
      throw new Error('Pass 1 returnerade inget svar');
    }

    const plan: ProjectPlan = JSON.parse(planJson);
    const pass1Time = Date.now() - pass1Start;

    console.log(`[Vercel AI Stream] ✅ Pass 1 completed: ${pass1Time}ms`);

    // ========================================================================
    // PASS 2 - WITH PROGRESS UPDATES
    // ========================================================================

    sendSSE(res, 'progress', { 
      progress: 50, 
      phase: 'Genererar arbetsposter och material...', 
      elapsed_ms: Date.now() - startTime 
    });

    console.log('[Vercel AI Stream] 🎯 Pass 2: Generating items...');
    const pass2Start = Date.now();

    const prompt2 = getPass2Prompt(plan);
    const seed2 = seed + 1;

    sendSSE(res, 'progress', { 
      progress: 55, 
      phase: 'OpenAI genererar detaljer...', 
      elapsed_ms: Date.now() - startTime 
    });

    const completion2 = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { 
          role: 'system', 
          content: 'Du genererar kompletta TSV-filer med arbetsposter och material för byggoffert. Var detaljerad och noggrann.' 
        },
        { role: 'user', content: prompt2 }
      ],
      temperature: 0.2,
      max_tokens: 2500,
      seed: seed2,
    });

    sendSSE(res, 'progress', { 
      progress: 85, 
      phase: 'Bearbetar resultat...', 
      elapsed_ms: Date.now() - startTime 
    });

    const tsvOutput = completion2.choices[0].message.content;
    if (!tsvOutput) {
      throw new Error('Pass 2 returnerade inget svar');
    }

    const tsv = tsvOutput
      .replace(/```tsv/gi, '')
      .replace(/```/g, '')
      .trim()
      .replace(/\\t/g, '\t')
      .replace(/\\n/g, '\n');

    const pass2Time = Date.now() - pass2Start;
    console.log(`[Vercel AI Stream] ✅ Pass 2 completed: ${pass2Time}ms`);

    // ========================================================================
    // PARSE AND FINALIZE
    // ========================================================================

    sendSSE(res, 'progress', { 
      progress: 95, 
      phase: 'Färdigställer offert...', 
      elapsed_ms: Date.now() - startTime 
    });

    const result = parseTSV(tsv, plan);
    const totalTime = Date.now() - startTime;

    console.log(`[Vercel AI Stream] ✅ COMPLETED in ${totalTime}ms`);

    // Optional: Save to Supabase
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('offer_generation_jobs').insert({
          description: description.trim(),
          project_type: projectType || 'full',
          status: 'completed',
          result,
          generation_time_ms: totalTime,
          pass1_time_ms: pass1Time,
          pass2_time_ms: pass2Time,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        });
      } catch (dbError) {
        console.warn('[Vercel AI Stream] ⚠️  Could not save to Supabase:', dbError);
      }
    }

    // Send final result
    sendSSE(res, 'complete', {
      result,
      timings: {
        total_ms: totalTime,
        pass1_ms: pass1Time,
        pass2_ms: pass2Time
      }
    });

    // End stream
    res.end();

  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[Vercel AI Stream] ❌ Error after ${elapsed}ms:`, error);

    sendSSE(res, 'error', {
      message: 'Fel vid AI-generering',
      details: error?.message || 'Okänt fel',
      elapsed_ms: elapsed
    });

    res.end();
  }
}
