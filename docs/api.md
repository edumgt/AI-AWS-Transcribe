# API 상세 문서

기본 서버 주소는 `http://localhost:3002` 입니다.

## 공통 사항

- 요청/응답 포맷: JSON
- Body 파싱: `express.json({ limit: "2mb" })`
- 에러 포맷: `{ "error": "message" }`
- 인증: 기본 예제에는 별도 인증 미적용(학습용)

---

## 1) GET /health

서버 상태 확인용 엔드포인트입니다.

### 응답 예시

```json
{ "ok": true }
```

---

## 2) POST /upload

학습용 업로드 API입니다. 서버가 로컬 파일 시스템 경로를 직접 읽어 S3로 업로드합니다.

> 운영 환경에서는 보안/구조상 `multipart 업로드` 또는 `presigned PUT` 방식으로 전환하세요.

### 요청 Body

```json
{
  "localPath": "/path/to/audio.mp3",
  "key": "transcribe-lab/input/custom-name.mp3"
}
```

- `localPath` (필수): 서버가 접근 가능한 로컬 파일 경로
- `key` (선택): 저장할 S3 Key. 미입력 시 `TRANSCRIBE_PREFIX + timestamp + filename`

### 응답 예시

```json
{
  "bucket": "your-bucket",
  "key": "transcribe-lab/input/1730000000000-audio.mp3",
  "s3Uri": "s3://your-bucket/transcribe-lab/input/1730000000000-audio.mp3"
}
```

---

## 3) POST /jobs

Transcribe Batch Job 생성 API입니다.

### 요청 Body

```json
{
  "mediaUri": "s3://your-bucket/transcribe-lab/input/audio.mp3",
  "mediaFormat": "mp3",
  "languageCode": "ko-KR",
  "identifyLanguage": false,
  "enableSpeakerLabels": false,
  "maxSpeakerLabels": 2,
  "vocabularyName": null,
  "jobName": "transcribe-lab-custom-job"
}
```

### 필드 설명

- `mediaUri` (필수): 전사 대상 파일 URI (`s3://...` 또는 접근 가능한 `https://...`)
- `mediaFormat` (선택): 기본 `mp3`
- `languageCode` (선택): 기본 `ko-KR`
- `identifyLanguage` (선택): `true`이면 자동 언어 감지 사용 (`languageCode` 대신)
- `enableSpeakerLabels` (선택): 화자 분리 on/off
- `maxSpeakerLabels` (선택): 화자 수 추정 상한
- `vocabularyName` (선택): Custom Vocabulary 이름
- `jobName` (선택): 미입력 시 timestamp 기반 자동 생성

### 응답

AWS Transcribe의 `TranscriptionJob` 객체가 그대로 반환됩니다.

---

## 4) GET /jobs

최근 작업 목록 조회 API입니다.

### Query

- `status` (선택): `QUEUED | IN_PROGRESS | FAILED | COMPLETED`

### 예시

```http
GET /jobs?status=IN_PROGRESS
```

### 응답 예시

```json
{
  "count": 1,
  "jobs": [
    {
      "TranscriptionJobName": "transcribe-lab-1730000000000",
      "TranscriptionJobStatus": "IN_PROGRESS",
      "CreationTime": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## 5) GET /jobs/:name

특정 작업의 상세 상태를 조회합니다.

### 예시

```http
GET /jobs/transcribe-lab-1730000000000
```

### 주요 확인 포인트

- `TranscriptionJobStatus`
- `FailureReason` (실패 시)
- `Transcript.TranscriptFileUri` (완료 시)

---

## 6) POST /jobs/:name/stop

진행 중 Job을 중단 요청합니다.

### 예시

```http
POST /jobs/transcribe-lab-1730000000000/stop
```

### 응답

```json
{ "ok": true }
```

---

## 7) DELETE /jobs/:name

Job 메타데이터를 삭제합니다.

### 예시

```http
DELETE /jobs/transcribe-lab-1730000000000
```

### 응답

```json
{ "ok": true }
```

---

## 8) GET /result?url=...

`TranscriptFileUri`의 JSON을 서버가 다운로드해 그대로 반환하는 프록시 엔드포인트입니다.

### 예시

```http
GET /result?url=https://.../transcribe-lab-1730000000000.json
```

### 활용

- 브라우저/프론트에서 CORS 또는 만료 URL 처리 단순화
- 서버 로직에서 후처리 파이프라인 연결

---

## 상태 코드 가이드

- `200`: 성공
- `400`: 필수 파라미터 누락
- `500`: 내부 오류(AWS 권한, 파일 경로 오류, 네트워크 문제 등)
