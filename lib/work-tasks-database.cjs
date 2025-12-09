/**
 * Shim for work-tasks-database
 * Version: 7.0.4-patch-4.3.9
 *
 * Purpose:
 * Vercel handlers require "./lib/work-tasks-database.cjs".
 * This file did not exist after hotfix renames.
 *
 * This shim re-exports the real module from whichever
 * location/extension it currently uses.
 */

function tryRequire(p) {
  try {
    return require(p);
  } catch (e) {
    return null;
  }
}

const candidates = [
  // same folder, common names
  "./work-tasks-database.cjs",
  "./work-tasks-database.js",
  "./work-tasks-database.ts",

  // sometimes libs live under src/
  "../../src/lib/work-tasks-database.cjs",
  "../../src/lib/work-tasks-database.js",
  "../../src/lib/work-tasks-database.ts",

  // or under api/lib but without suffix
  "./work-tasks-database-handler.cjs",
];

let mod = null;
for (const c of candidates) {
  mod = tryRequire(c);
  if (mod) break;
}

if (!mod) {
  throw new Error(
    "[work-tasks-database.cjs shim] Could not find real work-tasks-database module.\n" +
    "Tried:\n" + candidates.join("\n")
  );
}

module.exports = mod;
