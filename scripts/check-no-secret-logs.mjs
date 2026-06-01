#!/usr/bin/env node
/**
 * Static guard: fail CI if source code logs or otherwise leaks an API key.
 *
 * This is a defense-in-depth check for the rule in security.md / AGENTS.md:
 * "Never commit, log, print, or persist real API keys, tokens, or secrets."
 *
 * It scans tracked source files (not tests/docs) for patterns that print a
 * secret-bearing identifier, e.g. console.log(apiKey), console.error(key), or
 * JSON.stringify(apiKey).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components", "lib", "i18n", "styles"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

// Patterns that indicate a secret being logged or serialized.
const FORBIDDEN = [
  /console\.(log|info|warn|error|debug)\s*\([^)]*\b(apiKey|api_key|token|secret|password)\b/i,
  /JSON\.stringify\s*\([^)]*\b(apiKey|api_key|token|secret|password)\b/i,
];

/** @param {string} dir */
function walk(dir) {
  /** @type {string[]} */
  const files = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...walk(full));
    } else if (EXTENSIONS.has(extname(full))) {
      files.push(full);
    }
  }
  return files;
}

/** @type {{ file: string, line: number, text: string }[]} */
const violations = [];

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const lines = readFileSync(file, "utf-8").split(/\r?\n/);
    lines.forEach((text, index) => {
      if (FORBIDDEN.some((pattern) => pattern.test(text))) {
        violations.push({ file, line: index + 1, text: text.trim() });
      }
    });
  }
}

if (violations.length > 0) {
  console.error("\u2716 Secret-logging guard failed. Remove these patterns:\n");
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.text}`);
  }
  process.exit(1);
}

console.log("\u2714 Secret-logging guard passed.");
