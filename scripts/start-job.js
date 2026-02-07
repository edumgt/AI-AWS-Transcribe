#!/usr/bin/env node
/**
 * Start Transcribe batch job
 * Usage:
 *  node scripts/start-job.js --mediaUri s3://bucket/key --format mp3 --lang ko-KR
 */
const { startJob } = require("../server/transcribeClient");

function arg(name, def = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return def;
  return process.argv[idx + 1] ?? def;
}

(async () => {
  const mediaUri = arg("mediaUri");
  const mediaFormat = arg("format", "mp3");
  const languageCode = arg("lang", "ko-KR");
  const identifyLanguage = arg("identifyLanguage", "false") === "true";
  const speaker = arg("speaker", "false") === "true";
  const maxSpeakerLabels = Number(arg("maxSpeaker", "2"));
  const vocabularyName = arg("vocab");

  if (!process.env.AWS_REGION) throw new Error("AWS_REGION required");
  if (!process.env.TRANSCRIBE_BUCKET) throw new Error("TRANSCRIBE_BUCKET required");
  if (!mediaUri) throw new Error("--mediaUri required");

  const job = await startJob({
    mediaUri,
    mediaFormat,
    languageCode,
    identifyLanguage,
    enableSpeakerLabels: speaker,
    maxSpeakerLabels,
    vocabularyName
  });
  console.log(JSON.stringify(job, null, 2));
})().catch(e => {
  console.error(e);
  process.exit(1);
});
