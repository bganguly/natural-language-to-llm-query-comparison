#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$REPO_DIR/.env.local"

[[ -f "$ENV_FILE" ]] && { set -o allexport; source "$ENV_FILE"; set +o allexport; }

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "ERROR: VERCEL_TOKEN not set. Run bash $REPO_DIR/scripts/deploy.sh first."
  exit 1
fi

echo "==> Suspending nl-sql service..."

cd "$REPO_DIR"

vercel env rm ANTHROPIC_API_KEY production --yes --token "$VERCEL_TOKEN" 2>/dev/null || true
vercel env rm OPENAI_API_KEY production --yes --token "$VERCEL_TOKEN" 2>/dev/null || true
vercel env rm GOOGLE_API_KEY production --yes --token "$VERCEL_TOKEN" 2>/dev/null || true
vercel env rm SUSPENDED production --yes --token "$VERCEL_TOKEN" 2>/dev/null || true

printf "1" | vercel env add SUSPENDED production --token "$VERCEL_TOKEN"

echo "==> Redeploying with SUSPENDED=1..."
vercel --prod --yes --token "$VERCEL_TOKEN"

echo "==> Done. Service is suspended. UI will show the 'request access' banner."
echo "    To restore: bash $REPO_DIR/scripts/deploy.sh"
