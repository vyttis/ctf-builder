#!/usr/bin/env bash
# Apply every migration to an empty Postgres 16 and run the security checks.
#
# Uses DATABASE_URL when set (CI service container). Otherwise starts a
# throwaway local cluster with the Postgres binaries on this machine.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PSQL_OPTS=(-v ON_ERROR_STOP=1 -q -X)
RUN=()

cleanup() {
  if [[ -n "${PGTMP:-}" ]]; then
    "${RUN[@]}" "$PGBIN/pg_ctl" -D "$PGTMP/data" -m immediate stop >/dev/null 2>&1 || true
    rm -rf "$PGTMP"
  fi
}
trap cleanup EXIT

if [[ -z "${DATABASE_URL:-}" ]]; then
  PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1 || true)}"
  [[ -x "$PGBIN/initdb" ]] || { echo "No Postgres binaries found; set DATABASE_URL or PGBIN" >&2; exit 1; }
  PGTMP="$(mktemp -d)"
  PORT="${PGPORT_TEST:-55432}"
  if [[ "$(id -u)" == "0" ]]; then
    # Postgres refuses to run as root: start and stop it as nobody.
    chown -R nobody "$PGTMP"
    RUN=(runuser -u nobody --)
  fi
  "${RUN[@]}" "$PGBIN/initdb" -D "$PGTMP/data" -U postgres -A trust >/dev/null
  "${RUN[@]}" "$PGBIN/pg_ctl" -D "$PGTMP/data" -o "-p $PORT -k $PGTMP -c listen_addresses=''" -w start >/dev/null
  DATABASE_URL="postgresql://postgres@/postgres?host=$PGTMP&port=$PORT"
fi

psql "$DATABASE_URL" "${PSQL_OPTS[@]}" -f "$ROOT/supabase/tests/bootstrap.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "migrate $(basename "$f")"
  psql "$DATABASE_URL" "${PSQL_OPTS[@]}" -f "$f" >/dev/null
done
psql "$DATABASE_URL" "${PSQL_OPTS[@]}" -f "$ROOT/supabase/tests/security.sql" >/dev/null
echo "security checks passed"

if [[ "${TEST_ROLLBACK:-1}" == "1" ]]; then
  # Every rollback must apply cleanly newest first (later migrations may
  # depend on earlier ones), and the migrations must apply again on top.
  mapfile -t ROLLBACKS < <(ls "$ROOT"/supabase/rollback/*.sql | sort -r)
  for f in "${ROLLBACKS[@]}"; do
    echo "rollback $(basename "$f")"
    psql "$DATABASE_URL" "${PSQL_OPTS[@]}" -f "$f" >/dev/null
  done
  for (( i=${#ROLLBACKS[@]}-1; i>=0; i-- )); do
    echo "re-apply $(basename "${ROLLBACKS[$i]}")"
    psql "$DATABASE_URL" "${PSQL_OPTS[@]}" -f "$ROOT/supabase/migrations/$(basename "${ROLLBACKS[$i]}")" >/dev/null
  done
  echo "rollback and re-apply passed"
fi
