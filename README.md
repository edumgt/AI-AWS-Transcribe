# Amazon Transcribe + Node.js 실습 레포 (transcribe-lab)

Amazon Transcribe **Batch Transcription**를 Node.js(AWS SDK v3)로 호출해
- 오디오 파일(S3) 업로드
- Transcribe Job 생성/상태 조회/취소/삭제
- 결과(JSON) 다운로드 및 **SRT/VTT 변환**
- (옵션) Speaker diarization(화자 분리), 언어 자동 감지, Custom Vocabulary
까지 학습용으로 한 번에 실습할 수 있는 예제입니다.

> 본 레포는 **Batch Transcribe** 중심입니다. (Streaming은 옵션 확장)

## 구성
```
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
    Transcribe-Lab.postman_collection घोषणा
    Transcribe-Lab.postman_collection.json
    Transcribe-Lab.postman_environment.json
```

## 사전 준비
- Node.js 18+
- AWS 자격증명
- S3 버킷 1개 (입력 오디오 업로드용)

## 빠른 시작(서버)
```bash
cd server
npm i
export AWS_REGION=ap-northeast-2
export TRANSCRIBE_BUCKET=your-bucket
export TRANSCRIBE_PREFIX=transcribe-lab/input/
export TRANSCRIBE_OUTPUT_PREFIX=transcribe-lab/output/
node index.js
```

## 기본 흐름(배치)
1) 로컬 파일 → S3 업로드
2) `StartTranscriptionJob`
3) `GetTranscriptionJob`으로 완료 대기
4) 결과 JSON URL 다운로드
5) JSON → SRT/VTT 변환

자세한 사용법은 `docs/sample-commands.md` 참고.
