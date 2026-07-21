#!/usr/bin/env bash
# Serializes wp-env lifecycles across every repo on this shared self-hosted
# runner host (one physical Raspberry Pi, one runner service per repo, all
# able to execute concurrently). GitHub's `concurrency:` key only serializes
# jobs within a single repository, so a different repo's wp-env can still
# start while this job's wp-env is up -- colliding on fixed host ports or
# starving the host's RAM. A flock on a fixed host-wide path closes that gap
# for every repo that calls this script with the same lockfile.
#
# Usage: wp-env-host-lock.sh acquire|release
set -euo pipefail

LOCKFILE="${WP_ENV_HOST_LOCKFILE:-$HOME/.ci-wp-env.lock}"
# /tmp is shared machine-wide across all repos' runners, so the marker/pid
# files must be unique per run+job, not per repo -- otherwise two different
# repos' jobs racing "acquire" around the same time could read each other's
# markers.
KEY="${GITHUB_REPOSITORY//\//_}-${GITHUB_RUN_ID:-0}-${GITHUB_RUN_ATTEMPT:-0}-${GITHUB_JOB:-job}"
PIDFILE="/tmp/wp-env-host-lock-${KEY}.pid"
MARKER="/tmp/wp-env-host-lock-${KEY}"
TIMEOUT_SECONDS=1800

case "${1:-}" in
acquire)
  rm -f "${MARKER}.acquired" "${MARKER}.failed"
  (
    if flock -x -w "$TIMEOUT_SECONDS" 200; then
      touch "${MARKER}.acquired"
      exec sleep infinity
    else
      touch "${MARKER}.failed"
    fi
  ) 200>"$LOCKFILE" &
  echo $! >"$PIDFILE"

  for _ in $(seq 1 $((TIMEOUT_SECONDS + 20))); do
    if [ -f "${MARKER}.acquired" ]; then
      echo "Acquired host-wide wp-env lock ($LOCKFILE)."
      exit 0
    fi
    if [ -f "${MARKER}.failed" ]; then
      echo "::error::Timed out waiting for host-wide wp-env lock after ${TIMEOUT_SECONDS}s" >&2
      exit 1
    fi
    sleep 1
  done
  echo "::error::Timed out waiting for host-wide wp-env lock after ${TIMEOUT_SECONDS}s" >&2
  exit 1
  ;;
release)
  if [ -f "$PIDFILE" ]; then
    kill "$(cat "$PIDFILE")" 2>/dev/null || true
    rm -f "$PIDFILE"
  fi
  rm -f "${MARKER}.acquired" "${MARKER}.failed"
  ;;
*)
  echo "usage: $0 {acquire|release}" >&2
  exit 2
  ;;
esac
