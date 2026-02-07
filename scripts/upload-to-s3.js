#!/usr/bin/env node
/**
 * Upload local audio file to S3 for Transcribe
 * Usage:
 *  node scripts/upload-to-s3.js --file ./sample.wav
 */
const path = require("path");
const { uploadFile, getPrefix } = require("../server/s3Client");

function arg(name, def = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return def;
  return process.argv[idx + 1] ?? def;
}

(async () => {
  const file = arg("file");
  if (!process.env.AWS_REGION) throw new Error("AWS_REGION required");
  if (!process.env.TRANSCRIBE_BUCKET) throw new Error("TRANSCRIBE_BUCKET required");
  if (!file) throw new Error("--file required");

  const key = `${getPrefix()}${Date.now()}-${path.basename(file)}`;
  const out = await uploadFile({ localPath: file, key });
  console.log(JSON.stringify(out, null, 2));
})().catch(e => {
  console.error(e);
  process.exit(1);
});
