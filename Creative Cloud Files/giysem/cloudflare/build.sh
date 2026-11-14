#!/bin/sh
# Cloudflare Pages build: publish only the app's own front-end files
# (index.html and the top-level .css/.js files), like server.py does.
# Everything else (server.py, marketing/, this folder, dotfiles) stays private.
set -e
cd "$(dirname "$0")/.."
rm -rf dist
mkdir dist
cp index.html dist/
for f in *.css *.js; do
  case "$f" in
    *[!A-Za-z0-9_.-]*) continue ;;  # same naming rule as server.py's allowlist
  esac
  cp "$f" dist/
done
cp cloudflare/_headers dist/_headers
echo "Published files:" && ls dist
