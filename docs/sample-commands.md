# 샘플 커맨드

## 0) 환경변수
```bash
export AWS_REGION=ap-northeast-2
export TRANSCRIBE_BUCKET=your-bucket
export TRANSCRIBE_PREFIX=transcribe-lab/input/
export TRANSCRIBE_OUTPUT_PREFIX=transcribe-lab/output/
```

## 1) 로컬 파일 업로드 → S3 URI 얻기
```bash
node scripts/upload-to-s3.js --file ./your-audio.mp3
# 출력의 s3Uri 복사
```

## 2) 잡 시작
```bash
node scripts/start-job.js --mediaUri s3://your-bucket/transcribe-lab/input/....mp3 --format mp3 --lang ko-KR
# 출력에서 TranscriptionJobName 확인
```

## 3) 상태 확인(완료 대기)
```bash
node scripts/get-job.js --name transcribe-lab-....
```

완료되면 `Transcript.TranscriptFileUri` (https URL)가 나옵니다.

## 4) 결과 다운로드
```bash
node scripts/download-result.js --url "https://....json" --out result.json
```

## 5) 자막 변환
```bash
node scripts/json-to-srt.js --in result.json --out captions.srt --maxWords 12
node scripts/json-to-vtt.js --in result.json --out captions.vtt --maxWords 12
```
