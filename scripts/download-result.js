#!/usr/bin/env node
/**
 * Download Transcribe result JSON from TranscriptFileUri
 * Usage:
 *  node scripts/download-result.js --url https://.../xxx.json --out result.json
 */
const fs = require("fs");
const https = require("https");

function arg(name, def = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return def;
  return process.argv[idx + 1] ?? def;
}

(async () => {
  const url = arg("url");
  const out = arg("out", "result.json");
  if (!url) throw new Error("--url required");

  await new Promise((resolve, reject) => {
    https.get(url, r => {
      let data = "";
      r.on("data", c => (data += c));
      r.on("end", () => {
        fs.writeFileSync(out, data, "utf-8");
        resolve();
      });
    }).on("error", reject);
  });

  console.log(`Wrote: ${out}`);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
