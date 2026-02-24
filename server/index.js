const express = require("express");
const https = require("https");
const { uploadFile, getPrefix } = require("./s3Client");
const { startJob, getJob, stopJob, deleteJob, listJobs } 
  = require("./transcribeClient");

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

/**
 * POST /upload
 * body: { localPath: "/path/to/file.mp3", key?: "transcribe-lab/input/xxx.mp3" }
 * 주의: 학습용 예제라 "서버가 로컬 파일을 읽는" 형태입니다.
 * 실제 운영은 multipart 업로드 또는 presigned PUT을 권장.
 */
app.post("/upload", async (req, res) => {
  try {
    const { localPath, key } = req.body || {};
    if (!localPath) return res.status(400).json({ error: "localPath가 필요합니다." });

    const fileName = require("path").basename(localPath);
    const s3Key = key || `${getPrefix()}${Date.now()}-${fileName}`;
    const out = await uploadFile({ localPath, key: s3Key });
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message || "unknown error" });
  }
});

/**
 * POST /jobs
 * body: { mediaUri, mediaFormat, languageCode, identifyLanguage, enableSpeakerLabels, maxSpeakerLabels, vocabularyName }
 */
app.post("/jobs", async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.mediaUri) return res.status(400).json({ error: "mediaUri가 필요합니다. (예: s3://bucket/key)" });

    const job = await startJob(body);
    res.json(job);
  } catch (e) {
    res.status(500).json({ error: e.message || "unknown error" });
  }
});

app.get("/jobs", async (req, res) => {
  try {
    const status = req.query.status || null;
    const jobs = await listJobs({ status, maxResults: 20 });
    res.json({ count: jobs.length, jobs });
  } catch (e) {
    res.status(500).json({ error: e.message || "unknown error" });
  }
});

app.get("/jobs/:name", async (req, res) => {
  try {
    const job = await getJob(req.params.name);
    res.json(job);
  } catch (e) {
    res.status(500).json({ error: e.message || "unknown error" });
  }
});

app.post("/jobs/:name/stop", async (req, res) => {
  try {
    await stopJob(req.params.name);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "unknown error" });
  }
});

app.delete("/jobs/:name", async (req, res) => {
  try {
    await deleteJob(req.params.name);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "unknown error" });
  }
});

/**
 * GET /result?url=https://...json
 * Transcribe 결과 JSON URL(보통 presigned S3 URL)을 받아서 그대로 반환
 */
app.get("/result", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "url query가 필요합니다." });

    https.get(url, r => {
      let data = "";
      r.on("data", chunk => (data += chunk));
      r.on("end", () => {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.send(data);
      });
    }).on("error", err => {
      res.status(500).json({ error: err.message || "download error" });
    });
  } catch (e) {
    res.status(500).json({ error: e.message || "unknown error" });
  }
});

const port = process.env.PORT || 3002;
app.listen(port, () => console.log(`transcribe-lab server listening on :${port}`));
