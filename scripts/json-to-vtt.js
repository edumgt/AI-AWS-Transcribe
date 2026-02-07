#!/usr/bin/env node
/**
 * Convert Transcribe JSON → WebVTT
 * Usage:
 *  node scripts/json-to-vtt.js --in result.json --out captions.vtt --maxWords 12
 */
const fs = require("fs");
const { msToTimestamp } = require("../server/utils");

function arg(name, def = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return def;
  return process.argv[idx + 1] ?? def;
}

function secToMs(sec) { return Math.round(Number(sec) * 1000); }

(async () => {
  const input = arg("in");
  const output = arg("out", "captions.vtt");
  const maxWords = Number(arg("maxWords", "12"));

  if (!input) throw new Error("--in required");
  const json = JSON.parse(fs.readFileSync(input, "utf-8"));
  const items = json?.results?.items || [];

  const words = items.filter(it => it.type === "pronunciation" && it.start_time && it.end_time)
    .map(it => ({
      startMs: secToMs(it.start_time),
      endMs: secToMs(it.end_time),
      text: it.alternatives?.[0]?.content || ""
    }));

  let cues = [];
  let cur = null;

  for (const w of words) {
    if (!cur) {
      cur = { startMs: w.startMs, endMs: w.endMs, texts: [w.text] };
      continue;
    }
    cur.endMs = w.endMs;
    cur.texts.push(w.text);

    if (cur.texts.length >= maxWords) {
      cues.push(cur);
      cur = null;
    }
  }
  if (cur) cues.push(cur);

  let vtt = "WEBVTT\n\n";
  cues.forEach((c, idx) => {
    vtt += `${idx + 1}\n`;
    vtt += `${msToTimestamp(c.startMs, "vtt")} --> ${msToTimestamp(c.endMs, "vtt")}\n`;
    vtt += `${c.texts.join(" ")}\n\n`;
  });

  fs.writeFileSync(output, vtt, "utf-8");
  console.log(`Wrote: ${output} (${cues.length} cues)`);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
