# Amazon Transcribe(배치) 실습 커리큘럼 (Node.js)

## 목표
- 로컬 오디오를 S3에 업로드
- Batch Transcription Job 생성/상태 조회/정리
- 결과 JSON을 다운로드하고 SRT/VTT로 변환
- 옵션: 화자 분리, 언어 자동 감지, Custom Vocabulary

## 1회차: 기본 Job
- StartTranscriptionJob / GetTranscriptionJob
- OutputBucket/OutputKey로 결과 저장

## 2회차: 자막
- 결과 JSON 구조 이해(results.items)
- SRT/VTT 변환기 구현

## 3회차: 옵션 기능
- IdentifyLanguage(언어 자동 감지)
- ShowSpeakerLabels(화자 분리)
- Custom Vocabulary 연결

## 4회차: API 서버화
- 업로드(학습용) + 잡 생성/조회/삭제 API
- 에러/상태 관리

## 5회차: 캡스톤
- “회의 녹취 업로더”:
  - 업로드 → 잡 실행 → 완료 시 결과/자막 링크 제공
