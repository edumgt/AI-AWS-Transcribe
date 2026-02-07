# IAM 정책 예시(최소 권한)

## Transcribe + S3(입력/출력)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "transcribe:StartTranscriptionJob",
        "transcribe:GetTranscriptionJob",
        "transcribe:ListTranscriptionJobs",
        "transcribe:StopTranscriptionJob",
        "transcribe:DeleteTranscriptionJob"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET/transcribe-lab/*"
      ]
    }
  ]
}
```

> 출력 파일은 Transcribe 서비스가 S3에 쓰므로, 버킷 정책/권한이 필요할 수 있습니다.
일부 환경은 버킷 정책에서 Transcribe service principal을 허용해야 합니다.
