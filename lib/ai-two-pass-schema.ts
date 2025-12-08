/**
 * TWO-PASS AI SCHEMA - Version 6.0.8 (Vercel Compatible)
 * 
 * Pass 1: Structured Planning (Strict Schema med Enums)
 * Pass 2: TSV Expansion (Granulära arbetsmoment + Komplett materialhantering)
 */

// ============================================================================
// PASS 1 SCHEMA
// ============================================================================

export const Pass1Schema = {
  type: "object",
  properties: {
    work_blocks: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "forberedelse",
          "mark",
          "grund",
          "stomme",
          "tak",
          "fasad",
          "oppningar",
          "invandig_stomme",
          "ror",
          "ytskikt",
          "avslut"
        ]
      },
      minItems: 2,
      maxItems: 15
    },

    scope_tags: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "takbyte_papp",
          "takbyte_plat",
          "takbyte_tegel",
          "tak_reparation",
          "fasad_panel_ny",
          "fasad_panel_malning",
          "fasad_puts_ny",
          "fasad_puts_renovering",
          "badrum_totalrenovering",
          "badrum_delrenovering",
          "kok_totalrenovering",
          "kok_delrenovering",
          "tillbyggnad_tra_1plan",
          "tillbyggnad_tra_2plan",
          "altan_tradack",
          "grund_platta",
          "grund_plintar",
          "renovering_generisk"
        ]
      },
      minItems: 1,
      maxItems: 2
    },

    quantities: {
      type: "object",
      properties: {
        tak_area_m2: { type: ["number", "null"], minimum: 0 },
        fasad_area_m2: { type: ["number", "null"], minimum: 0 },
        golv_area_m2: { type: ["number", "null"], minimum: 0 },
        raaspont_byte_m2: { type: ["number", "null"], minimum: 0 },
        gips_area_m2: { type: ["number", "null"], minimum: 0 },
        kakel_area_m2: { type: ["number", "null"], minimum: 0 },
        langd_meter: { type: ["number", "null"], minimum: 0 },
        bredd_meter: { type: ["number", "null"], minimum: 0 },
        hojd_meter: { type: ["number", "null"], minimum: 0 },
        antal_fönster: { type: ["integer", "null"], minimum: 0 },
        antal_dorrar: { type: ["integer", "null"], minimum: 0 }
      },
      required: [
        "tak_area_m2", "fasad_area_m2", "golv_area_m2", "raaspont_byte_m2",
        "gips_area_m2", "kakel_area_m2", "langd_meter", "bredd_meter",
        "hojd_meter", "antal_fönster", "antal_dorrar"
      ],
      additionalProperties: false
    },

    material_choices: {
      type: "object",
      properties: {
        raaspont_dim: { type: ["string", "null"], enum: ["22x95", "23x95", "25x100", "generisk", null] },
        lakt_bar_dim: { type: ["string", "null"], enum: ["38x38", "38x50", "45x45", "generisk", null] },
        lakt_stro_dim: { type: ["string", "null"], enum: ["28x70", "25x75", "32x70", "generisk", null] },
        underlagspapp_typ: { type: ["string", "null"], enum: ["S-T", "T-Y", "generisk", null] },
        takpanel_typ: { type: ["string", "null"], enum: ["trapezplat", "bandtackning", "falsad_plat", "generisk", null] },
        regel_dim: { type: ["string", "null"], enum: ["45x45", "45x95", "45x145", "45x170", "45x195", "45x220", "generisk", null] },
        bjalklag_dim: { type: ["string", "null"], enum: ["45x195", "45x220", "45x245", "generisk", null] },
        isoleringsskiva_tjocklek: { type: ["string", "null"], enum: ["95mm", "145mm", "170mm", "195mm", "220mm", "generisk", null] },
        gipsskiva_typ: { type: ["string", "null"], enum: ["13mm standard", "15mm brandskydd", "13mm fukttålig", "generisk", null] },
        panel_dim: { type: ["string", "null"], enum: ["22x100", "25x100", "28x120", "28x145", "generisk", null] },
        panel_montering: { type: ["string", "null"], enum: ["liggande", "staende", "generisk", null] },
        puts_typ: { type: ["string", "null"], enum: ["mineralputz", "akrylputz", "silikonputz", "kalkbruksputz", "generisk", null] },
        kakel_storlek: { type: ["string", "null"], enum: ["200x200", "300x300", "300x600", "generisk", null] },
        klinker_storlek: { type: ["string", "null"], enum: ["300x300", "600x600", "generisk", null] },
        tatskikt_typ: { type: ["string", "null"], enum: ["membran", "flytande", "generisk", null] }
      },
      required: [
        "raaspont_dim", "lakt_bar_dim", "lakt_stro_dim", "underlagspapp_typ", "takpanel_typ",
        "regel_dim", "bjalklag_dim", "isoleringsskiva_tjocklek", "gipsskiva_typ",
        "panel_dim", "panel_montering", "puts_typ", "kakel_storlek", "klinker_storlek", "tatskikt_typ"
      ],
      additionalProperties: false
    },

    reuse_items: {
      type: "array",
      items: {
        type: "string",
        enum: ["takpannor", "taktegel", "takplat", "fönster", "dorrar", "kakel", "klinker", "panel", "golv", "koksluckor"]
      }
    },

    risk_options: {
      type: "object",
      properties: {
        byggstallning: { type: "boolean" },
        lift: { type: "boolean" },
        container: { type: "boolean" },
        skyddsplast: { type: "boolean" },
        tipp: { type: "boolean" }
      },
      required: ["byggstallning", "lift", "container", "skyddsplast", "tipp"],
      additionalProperties: false
    },

    assumptions: { type: "array", items: { type: "string" }, maxItems: 5 },
    not_included: { type: "array", items: { type: "string" }, maxItems: 5 },
    risk_level: { type: "integer", enum: [1, 2, 3] },
    risk_percentage: { type: "integer", minimum: 5, maximum: 30 },
    risk_reasoning: { type: "string", maxLength: 100 }
  },
  required: [
    "work_blocks", "scope_tags", "quantities", "material_choices", "reuse_items",
    "risk_options", "assumptions", "not_included", "risk_level", "risk_percentage", "risk_reasoning"
  ],
  additionalProperties: false
};

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export type WorkBlock = "forberedelse" | "mark" | "grund" | "stomme" | "tak" | "fasad" | "oppningar" | "invandig_stomme" | "ror" | "ytskikt" | "avslut";
export type ScopeTag = "takbyte_papp" | "takbyte_plat" | "takbyte_tegel" | "tak_reparation" | "fasad_panel_ny" | "fasad_panel_malning" | "fasad_puts_ny" | "fasad_puts_renovering" | "badrum_totalrenovering" | "badrum_delrenovering" | "kok_totalrenovering" | "kok_delrenovering" | "tillbyggnad_tra_1plan" | "tillbyggnad_tra_2plan" | "altan_tradack" | "grund_platta" | "grund_plintar" | "renovering_generisk";

export interface ProjectQuantities {
  tak_area_m2: number | null;
  fasad_area_m2: number | null;
  golv_area_m2: number | null;
  raaspont_byte_m2: number | null;
  gips_area_m2: number | null;
  kakel_area_m2: number | null;
  langd_meter: number | null;
  bredd_meter: number | null;
  hojd_meter: number | null;
  antal_fönster: number | null;
  antal_dorrar: number | null;
}

export interface MaterialChoices {
  raaspont_dim: "22x95" | "23x95" | "25x100" | "generisk" | null;
  lakt_bar_dim: "38x38" | "38x50" | "45x45" | "generisk" | null;
  lakt_stro_dim: "28x70" | "25x75" | "32x70" | "generisk" | null;
  underlagspapp_typ: "S-T" | "T-Y" | "generisk" | null;
  takpanel_typ: "trapezplat" | "bandtackning" | "falsad_plat" | "generisk" | null;
  regel_dim: "45x45" | "45x95" | "45x145" | "45x170" | "45x195" | "45x220" | "generisk" | null;
  bjalklag_dim: "45x195" | "45x220" | "45x245" | "generisk" | null;
  isoleringsskiva_tjocklek: "95mm" | "145mm" | "170mm" | "195mm" | "220mm" | "generisk" | null;
  gipsskiva_typ: "13mm standard" | "15mm brandskydd" | "13mm fukttålig" | "generisk" | null;
  panel_dim: "22x100" | "25x100" | "28x120" | "28x145" | "generisk" | null;
  panel_montering: "liggande" | "staende" | "generisk" | null;
  puts_typ: "mineralputz" | "akrylputz" | "silikonputz" | "kalkbruksputz" | "generisk" | null;
  kakel_storlek: "200x200" | "300x300" | "300x600" | "generisk" | null;
  klinker_storlek: "300x300" | "600x600" | "generisk" | null;
  tatskikt_typ: "membran" | "flytande" | "generisk" | null;
}

export interface RiskOptions {
  byggstallning: boolean;
  lift: boolean;
  container: boolean;
  skyddsplast: boolean;
  tipp: boolean;
}

export interface ProjectPlan {
  work_blocks: WorkBlock[];
  scope_tags: ScopeTag[];
  quantities: ProjectQuantities;
  material_choices: MaterialChoices;
  reuse_items: string[];
  risk_options: RiskOptions;
  assumptions: string[];
  not_included: string[];
  risk_level: 1 | 2 | 3;
  risk_percentage: number;
  risk_reasoning: string;
}

// ============================================================================
// PASS 2 PROMPT - V6.0.8 (GRANULÄRA ARBETSMOMENT)
// ============================================================================

export function getPass2Prompt(plan: ProjectPlan): string {
  const takArea = plan.quantities.tak_area_m2 || 0;
  const fasadArea = plan.quantities.fasad_area_m2 || 0;
  const golvArea = plan.quantities.golv_area_m2 || 0;
  const gipsArea = plan.quantities.gips_area_m2 || golvArea * 2.4;

  return `TSV-GENERATOR för komplett byggoffert

FORMAT: KATEGORI\\tTYP\\tBESKRIVNING\\tMÄNGD\\tENHET\\tA-PRIS\\tLEVERANTÖR

🎯 MÅL: 15-20 ARBETSMOMENT (separata per delmoment!) + 30-40 MATERIAL

🔨 SEPARATA ARBETSMOMENT PER WORK_BLOCK:

forberedelse:
- "Byggställning montering/demontering" (8 tim)
- "Skyddsåtgärder och byggtorkering" (4 tim)
- "Rivning och demontering" (varierar)

mark (om aktuellt):
- "Schaktning" (${golvArea > 0 ? Math.ceil(golvArea / 4) : 6} tim)
- "Läggning dräneringsrör" (4 tim)

grund (om aktuellt):
- "Montering av gjutform" (8 tim)
- "Armering" (6 tim)
- "Gjutning platta" (${golvArea > 0 ? Math.ceil(golvArea * 0.4) : 12} tim)

stomme (om aktuellt):
- "Resning ytterväggar" (${golvArea > 0 ? Math.ceil(golvArea * 1.0) : 30} tim)
- "Montering bjälklag" (${golvArea > 0 ? Math.ceil(golvArea * 0.5) : 15} tim)
- "Isolering ytterväggar" (${golvArea > 0 ? Math.ceil(golvArea * 0.4) : 12} tim)

tak (om aktuellt):
- "Montering takstolar" (${takArea > 0 ? Math.ceil(takArea * 0.3) : 10} tim)
- "Montering läkt och papp" (${takArea > 0 ? Math.ceil(takArea * 0.4) : 14} tim)

fasad (om aktuellt):
- "Grundbehandling fasad" (${fasadArea > 0 ? Math.ceil(fasadArea * 0.4) : 16} tim)
- "Putsning/panelmontering" (${fasadArea > 0 ? Math.ceil(fasadArea * 0.6) : 24} tim)
- "Finish fasad" (${fasadArea > 0 ? Math.ceil(fasadArea * 0.3) : 12} tim)

oppningar (om aktuellt):
- "Montering fönster" (${(plan.quantities.antal_fönster || 0) * 3} tim)
- "Montering dörrar" (${(plan.quantities.antal_dorrar || 0) * 4} tim)

invandig_stomme (om aktuellt):
- "Resning innerväggar" (${gipsArea > 0 ? Math.ceil(gipsArea * 0.15) : 12} tim)
- "Montering gips" (${gipsArea > 0 ? Math.ceil(gipsArea * 0.25) : 20} tim)
- "Fogning gips" (${gipsArea > 0 ? Math.ceil(gipsArea * 0.15) : 12} tim)

ytskikt (om aktuellt):
- "Spackling" (${gipsArea > 0 ? Math.ceil(gipsArea * 0.15) : 12} tim)
- "Grundmålning" (${gipsArea > 0 ? Math.ceil(gipsArea * 0.1) : 8} tim)
- "Slutmålning" (${gipsArea > 0 ? Math.ceil(gipsArea * 0.1) : 8} tim)
- "Golvbeläggning" (${golvArea > 0 ? Math.ceil(golvArea * 0.6) : 20} tim)

avslut:
- "Slutbesiktning" (1 tim)
- "Slutstädning" (4 tim)

🧱 MATERIAL PER WORK_BLOCK:

forberedelse: Presenning, avfallssäckar, byggskydd
mark: Makadam, fiberduk, dräneringsrör
grund: Betong ${Math.ceil(golvArea * 0.2)}m³, armering ${Math.ceil(golvArea * 8)}kg, formbrädor, byggfolie
stomme: Reglar ${Math.ceil(golvArea * 2)}m, bjälklag, isolering ${Math.ceil(golvArea * 1.05)}m², vindskydd, ångspärr, spik
tak: Takstolar, underlagspapp ${Math.ceil(takArea * 1.1)}m², läkt, takpapp, takpannespikar, butylband, silikon
fasad: Puts ${Math.ceil(fasadArea * 1.05)}m², primer, finish, hörnskydd, silikon
invandig_stomme: Gips ${Math.ceil(gipsArea)}m², gipsskruv, fogmassa, kantlist, primer
ytskikt: Spackel, färg, målartejp, penslar, golvmaterial ${golvArea}m²

MÄNGDER:
- Tak: ${takArea}m² (+10% = ${Math.ceil(takArea * 1.1)}m²)
- Fasad: ${fasadArea}m²
- Golv: ${golvArea}m²
- Gips: ${Math.ceil(gipsArea)}m²

WORK_BLOCKS: ${plan.work_blocks.join(', ')}

EXEMPEL TSV:

ARBETE\\tFörberedelse\\tByggställning montering/demontering\\t8\\ttim\\t550\\t-
ARBETE\\tFörberedelse\\tSkyddsåtgärder och byggtorkering\\t4\\ttim\\t550\\t-
MATERIAL\\tFörbrukning\\tPresenning 4x6m\\t2\\tst\\t350\\tByggmax
${golvArea > 0 ? `ARBETE\\tGrund\\tMontering gjutform\\t8\\ttim\\t550\\t-
ARBETE\\tGrund\\tArmering\\t6\\ttim\\t550\\t-
ARBETE\\tGrund\\tGjutning platta\\t${Math.ceil(golvArea * 0.4)}\\ttim\\t550\\t-
MATERIAL\\tGrund\\tBetong K30\\t${Math.ceil(golvArea * 0.2)}\\tm³\\t1200\\tBetongleverantör` : ''}
${golvArea > 0 ? `ARBETE\\tStomme\\tResning ytterväggar\\t${Math.ceil(golvArea * 1.0)}\\ttim\\t550\\t-
ARBETE\\tStomme\\tMontering bjälklag\\t${Math.ceil(golvArea * 0.5)}\\ttim\\t550\\t-
ARBETE\\tStomme\\tIsolering ytterväggar\\t${Math.ceil(golvArea * 0.4)}\\ttim\\t550\\t-` : ''}
${takArea > 0 ? `ARBETE\\tTak\\tMontering takstolar\\t${Math.ceil(takArea * 0.3)}\\ttim\\t550\\t-
ARBETE\\tTak\\tMontering läkt och papp\\t${Math.ceil(takArea * 0.4)}\\ttim\\t550\\t-` : ''}
${fasadArea > 0 ? `ARBETE\\tFasad\\tGrundbehandling fasad\\t${Math.ceil(fasadArea * 0.4)}\\ttim\\t550\\t-
ARBETE\\tFasad\\tPutsning\\t${Math.ceil(fasadArea * 0.6)}\\ttim\\t550\\t-
ARBETE\\tFasad\\tFinish fasad\\t${Math.ceil(fasadArea * 0.3)}\\ttim\\t550\\t-` : ''}
${gipsArea > 0 ? `ARBETE\\tInvändig stomme\\tResning innerväggar\\t${Math.ceil(gipsArea * 0.15)}\\ttim\\t550\\t-
ARBETE\\tInvändig stomme\\tMontering gips\\t${Math.ceil(gipsArea * 0.25)}\\ttim\\t550\\t-
ARBETE\\tInvändig stomme\\tFogning gips\\t${Math.ceil(gipsArea * 0.15)}\\ttim\\t550\\t-
MATERIAL\\tInvändigt\\tGipsskiva (standard dimension)\\t${Math.ceil(gipsArea)}\\tm²\\t100\\tByggmax` : ''}
ARBETE\\tAvslut\\tSlutbesiktning\\t1\\ttim\\t550\\t-
ARBETE\\tAvslut\\tSlutstädning\\t4\\ttim\\t550\\t-

GENERERA NU KOMPLETT TSV (15-20 ARBETSMOMENT + 30-40 MATERIAL):

${JSON.stringify(plan, null, 2)}`;
}
Kopiera ALLT ovanför och klistra in i GitHub-editorn! 📋

NU ligger dessa två i lib mapp lib ai-two-pass-schema.ts generate-offer-stream.ts
Oj! 😅 Det blev lite fel. generate-offer-stream.ts ska ligga i api/ mappen, INTE i lib/!

🔧 FIXAR VI:
STEG 1: Ta bort filen från lib/
Gå tillbaka till huvudsidan (klicka på repo-namnet)
Gå in i lib/ mappen
Klicka på generate-offer-stream.ts
Klicka på papperskorgen (🗑️) uppe till höger
Commit: "Remove file from wrong location"
STEG 2: Lägg till den på rätt plats
Gå tillbaka till huvudsidan
Klicka "Add file" → "Create new file"
Filnamn: api/generate-offer-stream.ts
Klistra in samma kod som förut (den långa streaming-koden)
Commit!
📂 RÄTT STRUKTUR SKA VARA:
vercel-ai-service/
├── api/
│   └── generate-offer-stream.ts  ← Här!
└── lib/
    └── ai-two-pass-schema.ts     ← Denna är rätt!
Fixar du detta så är vi nästan klara! 🚀

Nej jag sa fel, den ligger i API och bredvid den ligger lib som schemafilen ligger i
Ah perfekt! 🎉 Då är strukturen helt rätt!

✅ NUVARANDE STRUKTUR (KORREKT):
vercel-ai-service/
├── api/
│   └── generate-offer-stream.ts  ✅
└── lib/
    └── ai-two-pass-schema.ts     ✅
📋 NÄSTA STEG - Lägg till sista filerna:
1. Skapa package.json
Gå tillbaka till huvudsidan och klicka "Add file" → "Create new file"

Filnamn:

package.json
Innehåll:

{
  "name": "vercel-ai-service",
  "version": "2.0.0",
  "type": "module",
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@vercel/node": "^3.0.0",
    "openai": "^4.20.1"
  }
}
