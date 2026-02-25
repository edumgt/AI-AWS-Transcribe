# Amazon Transcribe + Node.js 실습 레포 (transcribe-lab)

Amazon Transcribe **Batch Transcription**를 Node.js(AWS SDK v3)로 실습할 수 있도록 구성한 프로젝트입니다.  
이 레포를 통해 다음 흐름을 한 번에 경험할 수 있습니다.

- 오디오 파일을 S3에 업로드
- Transcribe Job 생성/상태 조회/중단/삭제
- 결과 JSON 다운로드
- 결과를 SRT/VTT 자막 파일로 변환
- (옵션) 화자 분리(Speaker Labels), 언어 자동 감지, Custom Vocabulary

> 본 레포는 **Batch Transcribe** 중심입니다. (Streaming은 포함하지 않음)

---

## 1) 프로젝트 구조

```txt
transcribe-lab/
  server/
    index.js
    transcribeClient.js
    s3Client.js
    utils.js
    package.json
  scripts/
    upload-to-s3.js
    start-job.js
    get-job.js
    download-result.js
    json-to-srt.js
    json-to-vtt.js
  docs/
    transcribe-curriculum.md
    api.md
    iam-policy.md
    sample-commands.md
  postman/
    Transcribe-Lab.postman_collection.json
    Transcribe-Lab.postman_environment.json
```

---

## 2) 기술 스택

- **Runtime**: Node.js 18+
- **Server**: Express
- **AWS SDK**: AWS SDK for JavaScript v3 (`@aws-sdk/client-transcribe`, `@aws-sdk/client-s3`)
- **Infra 서비스**: Amazon S3, Amazon Transcribe
- **출력 포맷**: JSON, SRT, WebVTT

---

## 3) 동작 아키텍처 (배치 전사)

1. 사용자가 로컬 오디오를 업로드 (`scripts/upload-to-s3.js` 또는 `POST /upload`)
2. 서버/스크립트가 S3 URI를 기준으로 `StartTranscriptionJob` 호출
3. `GetTranscriptionJob`으로 상태를 폴링하여 `COMPLETED` 확인
4. `TranscriptFileUri`(JSON)를 다운로드
5. JSON의 `results.items`(단어 단위 timestamp)를 SRT/VTT로 변환

### 핵심 포인트
- 결과 저장 위치는 `OutputBucketName` + `OutputKey`로 지정됩니다.
- `identifyLanguage=true`면 `LanguageCode` 대신 자동 감지를 사용합니다.
- 화자 분리 시 `ShowSpeakerLabels`, `MaxSpeakerLabels`가 `Settings`에 포함됩니다.

---

## 4) 환경 변수

서버 및 스크립트 공통으로 아래 값을 사용합니다.

- `AWS_REGION` (예: `ap-northeast-2`)
- `TRANSCRIBE_BUCKET` (입력/출력 객체 저장 S3 버킷)
- `TRANSCRIBE_PREFIX` (기본 입력 경로, 기본값: `transcribe-lab/input/`)
- `TRANSCRIBE_OUTPUT_PREFIX` (기본 출력 경로, 기본값: `transcribe-lab/output/`)
- `PORT` (서버 포트, 기본값: `3002`)

---

## 5) AWS CLI 기반 사전 설정 (권장)

아래 단계는 콘솔 대신 **AWS CLI**로 실습 환경을 준비하는 절차입니다.

### 5.1 AWS CLI 설치 확인

```bash
aws --version
```

### 5.2 자격증명/리전 설정

```bash
aws configure
# AWS Access Key ID [None]: <YOUR_ACCESS_KEY>
# AWS Secret Access Key [None]: <YOUR_SECRET_KEY>
# Default region name [None]: ap-northeast-2
# Default output format [None]: json
```

프로파일을 분리하고 싶다면:

```bash
aws configure --profile transcribe-lab
export AWS_PROFILE=transcribe-lab
```

### 5.3 인증 상태 점검

```bash
aws sts get-caller-identity
```

### 5.4 S3 버킷 생성 - 없으면

```bash
export AWS_REGION=ap-northeast-2
export TRANSCRIBE_BUCKET=polly-bucket-edumgt

aws s3 mb s3://$TRANSCRIBE_BUCKET --region $AWS_REGION
```

### 5.5(선택) 폴더 프리픽스 생성

```bash
aws s3api put-object --bucket $TRANSCRIBE_BUCKET --key transcribe-lab/input/
aws s3api put-object --bucket $TRANSCRIBE_BUCKET --key transcribe-lab/output/
```

![alt text](image.png)

### 5.6(선택) 버킷 암호화 설정

```bash
aws s3api put-bucket-encryption \
  --bucket $TRANSCRIBE_BUCKET \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

### 5.7(중요) 로컬 환경 변수 주입

```bash
export AWS_REGION=ap-northeast-2
export TRANSCRIBE_BUCKET=polly-bucket-edumgt
export TRANSCRIBE_PREFIX=transcribe-lab/input/
export TRANSCRIBE_OUTPUT_PREFIX=transcribe-lab/output/
```

---

## 6) 서버 실행

```bash
cd server
npm i
node index.js
```

기본 주소: `http://localhost:3002`

- 헬스체크: `GET /health`
- API 상세: `docs/api.md`

---

## 7) 기본 실습 흐름 (CLI 스크립트)

```bash
# 1) 로컬 파일 업로드
node scripts/upload-to-s3.js --file ./sample.mp3

# 2) 잡 시작
node scripts/start-job.js --mediaUri s3://polly-bucket-edumgt/transcribe-lab/input/sample.mp3 --format mp3 --lang ko-KR
```
node scripts/start-job.js \
  --mediaUri "s3://polly-bucket-edumgt/transcribe-lab/input/1771910373810-sample.mp3" \
  --format mp3 \
  --lang ko-KR

```
---
```
root@DESKTOP-D6A344Q:/home/AI-AWS-Transcribe# node scripts/start-job.js \
  --mediaUri "s3://polly-bucket-edumgt/transcribe-lab/input/1770525723948-sample.mp3" \
  --format mp3 \
  --lang ko-KR
{
  "TranscriptionJobName": "transcribe-lab-1770525890213",
  "TranscriptionJobStatus": "IN_PROGRESS",
  "LanguageCode": "ko-KR",
  "MediaFormat": "mp3",
  "Media": {
    "MediaFileUri": "s3://polly-bucket-edumgt/transcribe-lab/input/1770525723948-sample.mp3"
  },
  "StartTime": "2026-02-08T04:44:50.326Z",
  "CreationTime": "2026-02-08T04:44:50.294Z"
}
```

# 3) 잡 상태 확인
node scripts/get-job.js --name transcribe-lab-1771910836157

```
root@DESKTOP-D6A344Q:/home/AI-AWS-Transcribe# node scripts/get-job.js --name transcribe-lab-1770525890213
{
  "TranscriptionJobName": "transcribe-lab-1770525890213",
  "TranscriptionJobStatus": "COMPLETED",
  "LanguageCode": "ko-KR",
  "MediaSampleRateHertz": 22050,
  "MediaFormat": "mp3",
  "Media": {
    "MediaFileUri": "s3://polly-bucket-edumgt/transcribe-lab/input/1770525723948-sample.mp3"
  },
  "Transcript": {
    "TranscriptFileUri": "https://s3.ap-northeast-2.amazonaws.com/polly-bucket-edumgt/transcribe-lab/output/transcribe-lab-1770525890213.json"
  },
  "StartTime": "2026-02-08T04:44:50.326Z",
  "CreationTime": "2026-02-08T04:44:50.294Z",
  "CompletionTime": "2026-02-08T04:44:56.744Z",
  "Settings": {
    "ChannelIdentification": false,
    "ShowAlternatives": false
  }
}

```

# 4) 결과 JSON 다운로드
node scripts/download-result.js --url "https://s3.ap-northeast-2.amazonaws.com/polly-bucket-edumgt/transcribe-lab/output/transcribe-lab-1771910836157.json" --out result.json

```
aws s3 presign "s3://polly-bucket-edumgt/transcribe-lab/output/transcribe-lab-1771910836157.json" \
  --region ap-northeast-2 \
  --expires-in 3600
```
---
```
root@DESKTOP-D6A344Q:/home/AI-AWS-Transcribe# aws s3 presign "s3://polly-bucket-edumgt/transcribe-lab/output/transcribe-lab-1770525890213.json" \
  --region ap-northeast-2 \
  --expires-in 3600
https://polly-bucket-edumgt.s3.ap-northeast-2.amazonaws.com/transcribe-lab/output/transcribe-lab-1770525890213.json?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIARIBXLWVEV5JWE6CP%2F20260208%2Fap-northeast-2%2Fs3%2Faws4_request&X-Amz-Date=20260208T044748Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=172d7ec94bf3827431b5eba712a053feae08e85e47a200040faa314f5fe1d173
```
```
wget -O transcribe.json "https://polly-bucket-edumgt.s3.ap-northeast-2.amazonaws.com/transcribe-lab/output/transcribe-lab-1771910836157.json?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIARIBXLWVEYUHA3ME6%2F20260224%2Fap-northeast-2%2Fs3%2Faws4_request&X-Amz-Date=20260224T054544Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=dcb3682aabe70d68548edf616fd9a99338ec09f7cc81aa7fb59ad880c1599768"
```

# 5) 자막 변환
node scripts/json-to-srt.js --in result.json --out captions.srt --maxWords 12
node scripts/json-to-vtt.js --in result.json --out captions.vtt --maxWords 12
```

더 많은 명령 예시는 `docs/sample-commands.md` 참고.

---

## 8) 서버 내부 구현 설명

### `server/index.js`
- Express 라우트 제공
- `/upload`: 로컬 파일 경로 기반 업로드(학습용)
- `/jobs`: 생성/목록/상세/중단/삭제
- `/result`: `TranscriptFileUri` JSON 프록시 다운로드

### `server/transcribeClient.js`
- TranscribeClient 생성
- `startJob/getJob/listJobs/stopJob/deleteJob` 래핑
- `identifyLanguage`, speaker labels, vocabulary 옵션 처리

### `server/s3Client.js`
- S3 업로드(`PutObjectCommand`)
- presigned GET URL 생성 지원

### `server/utils.js`
- `msToTimestamp`: SRT/VTT 타임스탬프 생성
- `safeJobName`: Job 이름 생성 규칙 단순화

---

## 9) 운영 전환 시 권장사항

현재 `/upload`는 서버가 로컬 파일 경로를 직접 읽는 학습용 방식입니다. 운영 환경에서는 아래 방식으로 교체하세요.

- `multipart/form-data` 업로드 엔드포인트
- Presigned PUT URL 발급 후 클라이언트 직접 업로드
- IAM 최소 권한 분리(업로드 역할, 전사 역할)
- Job 완료 이벤트 기반 처리(EventBridge + Lambda/SQS)
- 결과 JSON 및 자막 생성 워커 분리

---

## 10) 문서 안내

- API 상세: `docs/api.md`
- IAM 최소 권한 예시: `docs/iam-policy.md`
- 샘플 명령어 모음: `docs/sample-commands.md`
- 실습 커리큘럼: `docs/transcribe-curriculum.md`


## FE UI 추가
```
cd ui
docker build -t transcribe-ui-nginx .
docker run -d --name transcribe-ui -p 8080:80 transcribe-ui-nginx
```