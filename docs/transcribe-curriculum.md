# Amazon Transcribe(배치) 실습 커리큘럼 (Node.js)

이 커리큘럼은 단순 API 호출을 넘어, 전사 워크플로를 설계/확장하는 실무형 관점을 포함합니다.

---

## 학습 목표

- 오디오 업로드부터 전사 결과 자막화까지 End-to-End 흐름 구현
- AWS SDK v3 기반으로 Transcribe/S3 API 연동 구조 이해
- 전사 옵션(언어 감지, 화자 분리, Vocabulary)의 효과와 제약 이해
- 운영 전환 시 필요한 IAM/보안/비동기 처리 패턴 학습

---

## 선수 지식

- JavaScript/Node.js 기초
- REST API 기본
- AWS IAM/S3 기본 개념
- CLI 사용 경험(aws cli, bash)

---

## 사전 환경 준비 (AWS CLI 포함)

```bash
aws configure --profile transcribe-lab
export AWS_PROFILE=transcribe-lab

export AWS_REGION=ap-northeast-2
export TRANSCRIBE_BUCKET=your-bucket
export TRANSCRIBE_PREFIX=transcribe-lab/input/
export TRANSCRIBE_OUTPUT_PREFIX=transcribe-lab/output/

aws sts get-caller-identity
```

---

## 1회차: 기본 Transcription Job

### 이론

- `StartTranscriptionJob` 요청 파라미터
- `OutputBucketName/OutputKey` 저장 경로 제어
- 상태 전이: `QUEUED → IN_PROGRESS → COMPLETED/FAILED`

### 실습

1. `scripts/upload-to-s3.js`로 오디오 업로드
2. `scripts/start-job.js`로 잡 생성
3. `scripts/get-job.js`로 상태 조회
4. 완료 시 `TranscriptFileUri` 확인

### 체크포인트

- 리전 불일치 오류 원인 파악
- IAM 권한 누락 시 에러 메시지 해석

---

## 2회차: 결과 JSON 분석 및 자막 변환

### 이론

- Transcribe 결과 구조 (`results.transcripts`, `results.items`)
- `pronunciation` 항목의 `start_time/end_time` 활용
- SRT/VTT timestamp 포맷 차이

### 실습

1. `scripts/download-result.js`로 JSON 저장
2. `scripts/json-to-srt.js`, `scripts/json-to-vtt.js` 실행
3. `maxWords` 값 변경에 따른 가독성 비교

### 체크포인트

- 문장 경계가 아닌 단어 개수 기반 분할의 장단점 토론
- 한국어/영어 혼합 음성에서 결과 품질 비교

---

## 3회차: 고급 옵션

### 이론

- `IdentifyLanguage` vs `LanguageCode`
- 화자 분리(`ShowSpeakerLabels`, `MaxSpeakerLabels`)의 정확도 특성
- Custom Vocabulary 적용 시나리오(도메인 용어)

### 실습

1. 자동 언어 감지 Job 실행
2. 화자 분리 Job 실행
3. Vocabulary 연결 Job 실행
4. 각 결과를 JSON/자막으로 비교

### 체크포인트

- 오디오 품질(노이즈, 샘플링, 겹침 발화)이 결과에 미치는 영향

---

## 4회차: API 서버화 및 운영 관점

### 이론

- Express 기반 라우팅 구조
- 요청 검증/오류 응답 전략
- 학습용 업로드 방식의 한계와 운영 대안

### 실습

1. `/upload`, `/jobs`, `/jobs/:name` 호출
2. `/result`를 이용한 결과 프록시
3. 실패 Job(`FAILED`) 케이스 재현 및 로그 분석

### 운영 확장 과제

- Presigned URL 업로드
- EventBridge 기반 완료 이벤트 처리
- Queue/Worker 후처리 분리

---

## 5회차: 캡스톤

### 주제

“회의 녹취 업로더” 미니 프로젝트

### 요구사항

- 업로드 → 잡 생성 → 완료 확인 → 결과/자막 링크 반환
- 실패 시 재시도 또는 사용자 안내 메시지 제공
- 결과 파일 정리 정책(보관 기간, 키 네이밍) 수립

### 추가 도전 과제

- 잡 상태 폴링 백오프 적용
- 다중 사용자 요청 격리(사용자별 prefix)
- 간단 대시보드 또는 Postman 컬렉션 자동화

---

## 권장 평가 기준

- 기능 완성도(업로드~자막화)
- 에러 처리 품질(권한/리전/입력 오류 대응)
- 코드 가독성/모듈화
- 운영 확장 가능성(보안/비동기 설계)
