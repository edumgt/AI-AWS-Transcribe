# API

## POST /upload
학습용 간단 업로드(서버가 로컬 파일을 읽음)
```json
{ "localPath": "/path/to/audio.mp3" }
```
응답: `s3Uri`

## POST /jobs
```json
{
  "mediaUri": "s3://bucket/key",
  "mediaFormat": "mp3",
  "languageCode": "ko-KR",
  "identifyLanguage": false,
  "enableSpeakerLabels": false,
  "maxSpeakerLabels": 2,
  "vocabularyName": null
}
```

## GET /jobs
`?status=IN_PROGRESS` 등

## GET /jobs/:name
잡 상세

## GET /result?url=...
TranscriptFileUri(JSON) 다운로드 프록시
