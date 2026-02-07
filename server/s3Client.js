const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({ region: process.env.AWS_REGION });

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} 환경변수가 필요합니다.`);
  return v;
}

function getBucket() { return requireEnv("TRANSCRIBE_BUCKET"); }
function getPrefix() { return process.env.TRANSCRIBE_PREFIX || "transcribe-lab/input/"; }

async function uploadFile({ localPath, key }) {
  const bucket = getBucket();
  const body = fs.createReadStream(localPath);

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body
  }));

  return { bucket, key, s3Uri: `s3://${bucket}/${key}` };
}

async function presignGet({ key, expiresIn = 3600 }) {
  const bucket = getBucket();
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn });
}

module.exports = { uploadFile, presignGet, getBucket, getPrefix };
