#!/usr/bin/env node
/**
 * Get Transcribe job status
 * Usage:
 *  node scripts/get-job.js --name transcribe-lab-xxxxx
 */
const { getJob } = require("../server/transcribeClient");

function arg(name, def = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return def;
  return process.argv[idx + 1] ?? def;
}

(async () => {
  const name = arg("name");
  if (!name) throw new Error("--name required");
  const job = await getJob(name);
  console.log(JSON.stringify(job, null, 2));
})().catch(e => {
  console.error(e);
  process.exit(1);
});
