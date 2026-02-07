# IAM 정책 및 AWS CLI 설정 가이드

이 문서는 본 프로젝트를 실행하기 위한 **최소 권한 IAM 정책**과 AWS CLI를 통한 설정 방법을 설명합니다.

---

## 1) 최소 권한 IAM 정책 예시

아래 정책은 다음 동작을 허용합니다.

- Transcribe Job 생성/조회/목록/중단/삭제
- 지정한 S3 prefix(`transcribe-lab/*`)에 대한 업로드/다운로드

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TranscribeBatchBasic",
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
      "Sid": "S3InputOutputPrefix",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET/transcribe-lab/*"
      ]
    },
    {
      "Sid": "S3ListBucketForPrefix",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET",
      "Condition": {
        "StringLike": {
          "s3:prefix": [
            "transcribe-lab/*"
          ]
        }
      }
    }
  ]
}
```

> `YOUR_BUCKET`를 실제 버킷명으로 바꿔 사용하세요.

---

## 2) AWS CLI로 IAM 정책 생성/연결

### 2.1 정책 파일 저장

```bash
cat > transcribe-lab-policy.json <<'JSON'
{ ...위 JSON 정책 내용... }
JSON
```

### 2.2 고객 관리형 정책 생성

```bash
aws iam create-policy \
  --policy-name TranscribeLabPolicy \
  --policy-document file://transcribe-lab-policy.json
```

반환된 `Arn`을 기록합니다.

### 2.3 사용자 또는 역할에 정책 연결

사용자에 연결:

```bash
aws iam attach-user-policy \
  --user-name YOUR_IAM_USER \
  --policy-arn arn:aws:iam::<ACCOUNT_ID>:policy/TranscribeLabPolicy
```

역할에 연결:

```bash
aws iam attach-role-policy \
  --role-name YOUR_ROLE_NAME \
  --policy-arn arn:aws:iam::<ACCOUNT_ID>:policy/TranscribeLabPolicy
```

---

## 3) Transcribe가 S3 출력을 쓸 때 체크할 점

환경에 따라 Transcribe 서비스가 결과 파일을 S3에 쓰기 위해 버킷 정책 보강이 필요할 수 있습니다.

- 버킷 정책에서 `transcribe.amazonaws.com` 서비스 프린시펄 허용 여부
- KMS 사용 시 Transcribe 서비스/실행 주체에 KMS 권한 부여
- 버킷 소유자 강제 설정(Object Ownership) 및 ACL 정책 영향 확인

### 버킷 접근 문제 점검 명령

```bash
aws s3api get-bucket-policy --bucket YOUR_BUCKET
aws s3api get-bucket-location --bucket YOUR_BUCKET
```

---

## 4) AWS CLI 프로파일 권장 설정

```bash
aws configure --profile transcribe-lab
export AWS_PROFILE=transcribe-lab
aws sts get-caller-identity
```

리전이 코드의 `AWS_REGION`과 다르면 오류가 발생할 수 있으므로, CLI 리전과 환경변수 리전을 일치시키는 것을 권장합니다.
