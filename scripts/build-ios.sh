#!/usr/bin/env bash
# Build the static export for the Capacitor iOS wrap.
# Server-only routes are moved aside for the build then restored.

set -e

cd "$(dirname "$0")/.."

# Routes that can't be statically exported (server APIs, dynamic share targets, etc.)
EXCLUDE_PATHS=(
  "app/api"
  "app/challenge/[id]"
)

BACKUP_ROOT=".mobile-build-backup"

restore() {
  if [ -d "$BACKUP_ROOT" ]; then
    while IFS= read -r line; do
      ORIG_PATH="$line"
      BACKUP_PATH="$BACKUP_ROOT/$ORIG_PATH"
      if [ -e "$BACKUP_PATH" ]; then
        rm -rf "$ORIG_PATH"
        mkdir -p "$(dirname "$ORIG_PATH")"
        mv "$BACKUP_PATH" "$ORIG_PATH"
        echo "[build-ios] Restored $ORIG_PATH"
      fi
    done < "$BACKUP_ROOT/.manifest"
    rm -rf "$BACKUP_ROOT"
  fi
}

trap restore EXIT

mkdir -p "$BACKUP_ROOT"
: > "$BACKUP_ROOT/.manifest"

for ORIG in "${EXCLUDE_PATHS[@]}"; do
  if [ -e "$ORIG" ]; then
    BACKUP_PATH="$BACKUP_ROOT/$ORIG"
    mkdir -p "$(dirname "$BACKUP_PATH")"
    mv "$ORIG" "$BACKUP_PATH"
    echo "$ORIG" >> "$BACKUP_ROOT/.manifest"
    echo "[build-ios] Moved $ORIG aside"
  fi
done

echo "[build-ios] Running Next.js static export…"
CAPACITOR_BUILD=true next build

echo "[build-ios] Syncing to iOS project…"
npx cap sync ios

echo "[build-ios] Done."
