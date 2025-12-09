# HOTFIX 4.3.5 – CORS FIX

**Version:** 7.0.4-patch-4.3.5  
**Datum:** 2025-12-09  
**Risk:** 🟢 Low (endast headers/preflight, ingen affärslogik ändrad)

---

## Bakgrund / Problem

Efter Hotfix 4.3.4 (ESM wrappers + CJS logic) upptäcktes att Webflow-frontenden inte kunde anropa Vercel-API:t p.g.a. CORS:

- Preflight-anrop (OPTIONS) till t.ex. `/api/generate-offer` saknade `Access-Control-Allow-Origin`
- Browsern blockerade fetch från origin:  
  `https://gesa-company-ab.webflow.io`
- Resultat i konsol:  
  “Response to preflight request doesn't pass access control check…”

---

## Lösning

Införde en **centraliserad CORS helper** och använde den i samtliga CJS-endpoints.

### Ny fil
- `api/lib/cors.cjs`
  - Sätter CORS-headers konsekvent
  - Hanterar preflight genom att returnera `204 No Content`
  - Tillåter nödvändiga headers inkl. **`x-job-secret`** för async job-flöden

### Uppdaterade filer (6 endpoints)
- `api/health.cjs`
- `api/test-cors.cjs`
- `api/generate-offer.cjs`
- `api/ai/create-offer-job.cjs`
- `api/ai/process-offer-job.cjs`
- `api/ai/job-status/[jobId].cjs`

### Arkitektur (oförändrad)
Hotfixen **behåller Hotfix 4.3.4-upplägget**:
- `.js` = ESM wrappers för Vercel discovery (passthrough)
- `.cjs` = faktisk logik + CORS

Inga förändringar i `.js`-wrappers.

---

## Implementation

### CORS helper (api/lib/cors.cjs)

- `Access-Control-Allow-Origin`:
  - Tillåter Webflow prod/staging + localhost
  - Fallback till `*` om origin inte matchar (nuvarande låg-risk val)
- `Access-Control-Allow-Methods: GET,POST,OPTIONS`
- `Access-Control-Allow-Headers` inkluderar:
  - `Content-Type`
  - `Authorization`
  - `X-Requested-With`
  - **`x-job-secret`**
- Preflight:
  - Om `req.method === "OPTIONS"` → returnera `204` direkt

### Användning i endpoints

```js
const applyCors = require("./lib/cors.cjs");

module.exports = async (req, res) => {
  if (applyCors(req, res)) return res.status(204).end();
  // ... befintlig logik oförändrad ...
};
