#!/bin/bash
# =============================================================================
# iExist 데이터베이스 백업 스크립트
# 사용법: ./backup-db.sh [daily|weekly|manual]
# =============================================================================

# 설정
BACKUP_TYPE=${1:-daily}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y%m%d)

# 환경 변수 로드 (프로덕션 서버에서 설정)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-iexist_user}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_NAME:-iexist_production}

# 백업 디렉토리 설정
BACKUP_BASE_DIR="/var/backups/iexist"
BACKUP_DIR="${BACKUP_BASE_DIR}/${BACKUP_TYPE}"
LOG_DIR="${BACKUP_BASE_DIR}/logs"

# 보관 기간 설정 (일 단위)
DAILY_RETENTION=7
WEEKLY_RETENTION=30
MANUAL_RETENTION=90

# 디렉토리 생성
mkdir -p "${BACKUP_DIR}"
mkdir -p "${LOG_DIR}"

# 로그 파일
LOG_FILE="${LOG_DIR}/backup_${DATE}.log"

# 로그 함수
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# 에러 핸들링
error_exit() {
    log "ERROR: $1"
    exit 1
}

# 백업 시작
log "=========================================="
log "백업 시작: ${BACKUP_TYPE}"
log "데이터베이스: ${DB_NAME}"
log "=========================================="

# 백업 파일명
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${BACKUP_TYPE}_${TIMESTAMP}.sql.gz"

# mysqldump 실행
log "mysqldump 실행 중..."
mysqldump \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --user="${DB_USER}" \
    --password="${DB_PASSWORD}" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --add-drop-table \
    --complete-insert \
    "${DB_NAME}" 2>> "${LOG_FILE}" | gzip > "${BACKUP_FILE}"

# 백업 결과 확인
if [ $? -eq 0 ] && [ -f "${BACKUP_FILE}" ] && [ -s "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
    log "백업 성공: ${BACKUP_FILE}"
    log "파일 크기: ${BACKUP_SIZE}"
else
    error_exit "백업 실패!"
fi

# 백업 무결성 검증
log "백업 파일 검증 중..."
gunzip -t "${BACKUP_FILE}" 2>> "${LOG_FILE}"
if [ $? -eq 0 ]; then
    log "백업 파일 무결성 확인 완료"
else
    error_exit "백업 파일이 손상되었습니다!"
fi

# 오래된 백업 파일 삭제
log "오래된 백업 파일 정리 중..."
case ${BACKUP_TYPE} in
    daily)
        RETENTION=${DAILY_RETENTION}
        ;;
    weekly)
        RETENTION=${WEEKLY_RETENTION}
        ;;
    manual)
        RETENTION=${MANUAL_RETENTION}
        ;;
    *)
        RETENTION=${DAILY_RETENTION}
        ;;
esac

# 보관 기간이 지난 파일 삭제
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "*.sql.gz" -type f -mtime +${RETENTION} -delete -print | wc -l)
log "삭제된 오래된 백업 파일: ${DELETED_COUNT}개"

# 현재 백업 현황
TOTAL_BACKUPS=$(find "${BACKUP_DIR}" -name "*.sql.gz" -type f | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
log "현재 보관 중인 백업: ${TOTAL_BACKUPS}개 (${TOTAL_SIZE})"

log "=========================================="
log "백업 완료!"
log "=========================================="

# 선택적: 원격 스토리지로 복사 (S3, Google Cloud Storage 등)
# aws s3 cp "${BACKUP_FILE}" "s3://your-bucket/backups/${BACKUP_TYPE}/"
# gsutil cp "${BACKUP_FILE}" "gs://your-bucket/backups/${BACKUP_TYPE}/"

exit 0
