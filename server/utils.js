function msToTimestamp(ms, format = "srt") {
  const s = Math.floor(ms / 1000);
  const milli = ms % 1000;
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");

  if (format === "vtt") {
    return `${hh}:${mm}:${ss}.${String(milli).padStart(3, "0")}`;
  }
  // srt: comma
  return `${hh}:${mm}:${ss},${String(milli).padStart(3, "0")}`;
}

function safeJobName(prefix = "transcribe-lab") {
  // jobName 제한: 영문/숫자/._- (최대 200)
  const ts = Date.now();
  return `${prefix}-${ts}`.slice(0, 200);
}

module.exports = { msToTimestamp, safeJobName };
