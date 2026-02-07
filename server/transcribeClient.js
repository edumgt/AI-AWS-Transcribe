const { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand, ListTranscriptionJobsCommand, DeleteTranscriptionJobCommand, StopTranscriptionJobCommand } = require("@aws-sdk/client-transcribe");
const { safeJobName } = require("./utils");

function requireEnv(name, fallback = null) {
  const v = process.env[name] ?? fallback;
  if (v === null || v === undefined || v === "") throw new Error(`${name} 환경변수가 필요합니다.`);
  return v;
}

const client = new TranscribeClient({ region: requireEnv("AWS_REGION") });

function defaultOutputBucket() {
  return requireEnv("TRANSCRIBE_BUCKET");
}

function defaultOutputKeyPrefix() {
  return process.env.TRANSCRIBE_OUTPUT_PREFIX || "transcribe-lab/output/";
}

async function startJob({
  mediaUri,                 // s3://... or https://...
  mediaFormat = "mp3",      // mp3|mp4|wav|flac|ogg|amr|webm...
  languageCode = "ko-KR",   // e.g. ko-KR
  identifyLanguage = false, // auto language detect
  jobName = null,
  enableSpeakerLabels = false,
  maxSpeakerLabels = 2,
  vocabularyName = null
}) {
  const name = jobName || safeJobName("transcribe-lab");

  const params = {
    TranscriptionJobName: name,
    Media: { MediaFileUri: mediaUri },
    MediaFormat: mediaFormat,
    OutputBucketName: defaultOutputBucket(),
    OutputKey: `${defaultOutputKeyPrefix()}${name}.json`
  };

  if (identifyLanguage) {
    params.IdentifyLanguage = true;
  } else {
    params.LanguageCode = languageCode;
  }

  if (enableSpeakerLabels) {
    params.Settings = params.Settings || {};
    params.Settings.ShowSpeakerLabels = true;
    params.Settings.MaxSpeakerLabels = maxSpeakerLabels;
  }

  if (vocabularyName) {
    params.Settings = params.Settings || {};
    params.Settings.VocabularyName = vocabularyName;
  }

  const res = await client.send(new StartTranscriptionJobCommand(params));
  return res.TranscriptionJob;
}

async function getJob(jobName) {
  const res = await client.send(new GetTranscriptionJobCommand({ TranscriptionJobName: jobName }));
  return res.TranscriptionJob;
}

async function stopJob(jobName) {
  await client.send(new StopTranscriptionJobCommand({ TranscriptionJobName: jobName }));
}

async function deleteJob(jobName) {
  await client.send(new DeleteTranscriptionJobCommand({ TranscriptionJobName: jobName }));
}

async function listJobs({ status = null, maxResults = 20 } = {}) {
  const res = await client.send(new ListTranscriptionJobsCommand({
    Status: status || undefined,
    MaxResults: maxResults
  }));
  return res.TranscriptionJobSummaries || [];
}

module.exports = { startJob, getJob, stopJob, deleteJob, listJobs };
