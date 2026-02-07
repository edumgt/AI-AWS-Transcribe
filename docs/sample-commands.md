# 샘플 커맨드 모음

아래는 이 프로젝트를 빠르게 실습하기 위한 커맨드 모음입니다.

---

## 0) AWS CLI/환경 변수 준비

```bash
# (선택) 프로파일 설정
aws configure --profile transcribe-lab
export AWS_PROFILE=transcribe-lab

# 공통 환경변수
export AWS_REGION=ap-northeast-2
export TRANSCRIBE_BUCKET=your-bucket
export TRANSCRIBE_PREFIX=transcribe-lab/input/
export TRANSCRIBE_OUTPUT_PREFIX=transcribe-lab/output/

# 인증 확인
aws sts get-caller-identity
```

---

## 1) 의존성 설치 및 서버 실행

```bash
cd server
npm i
node index.js
```

헬스체크:

```bash
curl http://localhost:3002/health
```

---

## 2) 로컬 파일 업로드 → S3 URI 얻기

```bash
node scripts/upload-to-s3.js --file ./your-audio.mp3
```

출력 예:

```json
{
  "bucket": "your-bucket",
  "key": "transcribe-lab/input/1730000000000-your-audio.mp3",
  "s3Uri": "s3://your-bucket/transcribe-lab/input/1730000000000-your-audio.mp3"
}
```

---

## 3) 잡 시작

### 3.1 기본(언어 코드 지정)

```bash
node scripts/start-job.js \
  --mediaUri s3://your-bucket/transcribe-lab/input/1730000000000-your-audio.mp3 \
  --format mp3 \
  --lang ko-KR
```

### 3.2 자동 언어 감지

```bash
node scripts/start-job.js \
  --mediaUri s3://your-bucket/transcribe-lab/input/1730000000000-your-audio.mp3 \
  --format mp3 \
  --identifyLanguage true
```

### 3.3 화자 분리 + Vocabulary

```bash
node scripts/start-job.js \
  --mediaUri s3://your-bucket/transcribe-lab/input/1730000000000-your-audio.mp3 \
  --format mp3 \
  --lang ko-KR \
  --speaker true \
  --maxSpeakerLabels 2 \
  --vocabularyName your-vocab-name
```

---

## 4) 상태 확인(완료 대기)

```bash
node scripts/get-job.js --name transcribe-lab-1730000000000
```

`TranscriptionJobStatus`가 `COMPLETED`가 되면 아래 값을 사용합니다.

- `Transcript.TranscriptFileUri`

---

## 5) 결과 다운로드

```bash
node scripts/download-result.js \
  --url "https://....json" \
  --out result.json
```

---

## 6) JSON → 자막 변환

```bash
node scripts/json-to-srt.js --in result.json --out captions.srt --maxWords 12
node scripts/json-to-vtt.js --in result.json --out captions.vtt --maxWords 12
```

`maxWords`를 줄이면 더 짧은 자막 조각이 생성됩니다.

---

## 7) API 방식으로 실습 (curl)

### 7.1 업로드

```bash
curl -X POST http://localhost:3002/upload \
  -H 'Content-Type: application/json' \
  -d '{"localPath":"/absolute/path/to/your-audio.mp3"}'
```

### 7.2 잡 생성

```bash
curl -X POST http://localhost:3002/jobs \
  -H 'Content-Type: application/json' \
  -d '{
    "mediaUri":"s3://your-bucket/transcribe-lab/input/1730000000000-your-audio.mp3",
    "mediaFormat":"mp3",
    "languageCode":"ko-KR",
    "identifyLanguage":false,
    "enableSpeakerLabels":false
  }'
```

### 7.3 목록/상세 조회

```bash
curl "http://localhost:3002/jobs?status=IN_PROGRESS"
curl "http://localhost:3002/jobs/transcribe-lab-1730000000000"
```

### 7.4 중단/삭제

```bash
curl -X POST "http://localhost:3002/jobs/transcribe-lab-1730000000000/stop"
curl -X DELETE "http://localhost:3002/jobs/transcribe-lab-1730000000000"
```
