#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT_REGEX=':30(0[0-9]|1[0-5])$'
CANDIDATE_FILE="$(mktemp)"
KILL_FILE="$(mktemp)"

cleanup() {
  rm -f "${CANDIDATE_FILE}" "${KILL_FILE}"
}

trap cleanup EXIT

echo "[dev-reset] root: ${ROOT_DIR}"
echo "[dev-reset] scanning next dev processes..."

lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null \
  | awk -v re="${PORT_REGEX}" 'NR>1 && $9 ~ re {print $2}' \
  >> "${CANDIDATE_FILE}" || true

if command -v pgrep >/dev/null 2>&1; then
  pgrep -f "next dev" 2>/dev/null >> "${CANDIDATE_FILE}" || true
fi

sort -u "${CANDIDATE_FILE}" | while IFS= read -r pid; do
  [ -n "${pid}" ] || continue

  cmd="$(ps -p "${pid}" -o command= 2>/dev/null || true)"
  case "${cmd}" in
    *"next dev"*) ;;
    *) continue ;;
  esac

  cwd="$(lsof -a -p "${pid}" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1)"
  [ "${cwd}" = "${ROOT_DIR}" ] || continue

  echo "${pid}" >> "${KILL_FILE}"
done

if [ -s "${KILL_FILE}" ]; then
  echo "[dev-reset] terminating next dev PIDs: $(tr '\n' ' ' < "${KILL_FILE}" | sed 's/[[:space:]]*$//')"
  while IFS= read -r pid; do
    kill "${pid}" 2>/dev/null || true
  done < "${KILL_FILE}"
  sleep 1
  while IFS= read -r pid; do
    if kill -0 "${pid}" 2>/dev/null; then
      kill -9 "${pid}" 2>/dev/null || true
    fi
  done < "${KILL_FILE}"
else
  echo "[dev-reset] no matching next dev process found."
fi

if [ -d "${ROOT_DIR}/.next" ]; then
  echo "[dev-reset] removing ${ROOT_DIR}/.next"
  rm -rf "${ROOT_DIR}/.next"
else
  echo "[dev-reset] .next directory not present."
fi

echo "[dev-reset] listening ports 3000-3015 after cleanup:"
lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null \
  | awk -v re="${PORT_REGEX}" 'NR>1 && $9 ~ re {print $1, $2, $9}' || true

echo "[dev-reset] done."
