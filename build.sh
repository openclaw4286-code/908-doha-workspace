#!/usr/bin/env bash
# Vercel build entrypoint.
# 1) Builds the workspace app (app/) with Vite → app/dist
# 2) Copies the design system static site under app/dist/ds/
# The final outputDirectory is app/dist; workspace at /, design system at /ds/.

set -euo pipefail

echo "→ building workspace app"
npm --prefix app ci --no-audit --no-fund
npm --prefix app run build

DS_OUT=app/dist/ds
echo "→ staging design system under ${DS_OUT}"
mkdir -p "$DS_OUT"
cp index.html colors_and_type.css "$DS_OUT"/
cp -R docs preview assets ui_kits fonts dist "$DS_OUT"/

# Optional extras
[ -f "908 Doha Toast.html" ] && cp "908 Doha Toast.html" "$DS_OUT"/ || true

echo "→ done"
