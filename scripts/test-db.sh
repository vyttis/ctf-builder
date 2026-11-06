#!/usr/bin/env bash
# Apply every migration to an empty Postgres 16 and run the security checks.
#
# Uses DATABASE_URL when set (CI service container). Otherwise starts a
# throwaway local cluster with the Postgres binaries on this machine.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PSQL_OPTS=(-v ON_ERROR_STOP=1 -q -X)

cleanup() {
  if [[ -n "${PGTMP:-}" ]]; then
    "$PGBIN/pg_ctl" -D "$PGTMP/data" -m immediate stop >/dev/null 2>&1 || true
    rm -rf "$PGTMP"
  fi
}
trap cleanup EXIT

if [[ -z "${DATABASE_URL:-}" ]]; then
  PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
  [[ -x "$PGBIN/initdb" ]] || { echo "No Postgres binaries found; set DATABASE_URL or PGBIN" >&2; exit 1; }
  PGTMP="$(mktemp -d)"
  PORT="${PGPORT_TEST:-55432}"
  if [[ "$(id -u)" == "0" ]]; then
    chown -R nobody "$PGTMP"
    RUN=(runuser -u nobody --)
  else
    RUN=()
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
  # The rollback must apply cleanly and the migration must apply again on top.
  for f in "$ROOT"/supabase/rollback/*.sql; do
    echo "rollback $(basename "$f")"
    psql "$DATABASE_URL" "${PSQL_OPTS[@]}" -f "$f" >/dev/null
    psql "$DATABASE_URL" "${PSQL_OPTS[@]}" -f "$ROOT/supabase/migrations/$(basename "$f")" >/dev/null
  done
  echo "rollback and re-apply passed"
fi
