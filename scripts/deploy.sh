#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$REPO_DIR/.env.local"

cd "$REPO_DIR"

echo "==> nl-sql deploy"

if ! command -v vercel &>/dev/null; then
  echo "==> vercel CLI not found — installing globally..."
  npm install -g vercel
fi

[[ -f "$ENV_FILE" ]] || touch "$ENV_FILE"

set -o allexport
source "$ENV_FILE"
set +o allexport

prompt_secret() {
  local key="$1" prompt_text="$2"
  if [[ -z "${!key:-}" ]]; then
    printf "%s: " "$prompt_text"
    read -rs value
    echo
    eval "export $key=\"\$value\""
    echo "$key=$value" >> "$ENV_FILE"
  fi
}

prompt_secret VERCEL_TOKEN        "Vercel token — https://vercel.com/account/tokens → Create → scope: Full Account"
prompt_secret ANTHROPIC_API_KEY   "Anthropic API key — https://console.anthropic.com/settings/keys (sk-ant-...)"
prompt_secret OPENAI_API_KEY      "OpenAI API key — https://platform.openai.com/api-keys (sk-...)"
prompt_secret GOOGLE_API_KEY      "Google API key — https://aistudio.google.com/app/apikey (AIza...)"
prompt_secret RESEND_API_KEY      "Resend API key — https://resend.com/api-keys → Create API Key (re_...)"
prompt_secret UPSTASH_REDIS_REST_URL    "Upstash Redis REST URL — https://vercel.com/dashboard → Integrations → Upstash → your store → .env.local tab → UPSTASH_REDIS_REST_URL"
prompt_secret UPSTASH_REDIS_REST_TOKEN  "Upstash Redis REST token — same .env.local tab → UPSTASH_REDIS_REST_TOKEN"

export VERCEL_TOKEN

echo "==> Vercel identity: $(vercel whoami --token "$VERCEL_TOKEN")"

echo "==> npm install"
npm install

echo "==> Pushing env vars to Vercel production..."

push_env() {
  local key="$1"
  local val="${!key:-}"
  [[ -n "$val" ]] || return 0
  vercel env rm "$key" production --yes --token "$VERCEL_TOKEN" 2>/dev/null || true
  printf "%s" "$val" | vercel env add "$key" production --token "$VERCEL_TOKEN"
  echo "    $key set"
}

push_env ANTHROPIC_API_KEY
push_env OPENAI_API_KEY
push_env GOOGLE_API_KEY
push_env RESEND_API_KEY
push_env UPSTASH_REDIS_REST_URL
push_env UPSTASH_REDIS_REST_TOKEN

vercel env rm SUSPENDED production --yes --token "$VERCEL_TOKEN" 2>/dev/null || true

echo "==> Deploying to production..."
DEPLOY_OUT=$(vercel --prod --yes --token "$VERCEL_TOKEN" 2>&1)
echo "$DEPLOY_OUT"

VERCEL_URL="https://natural-language-to-llm-query-comparison.vercel.app"

if [[ -n "$VERCEL_URL" ]]; then
  LIVE_URL="${VERCEL_URL}/nl-to-sql/"
  PORTFOLIO_DIR="$(cd "$REPO_DIR/../.." && pwd)/portfolio"
  LIVE_URLS_FILE="$PORTFOLIO_DIR/live-urls.js"

  if [[ -f "$LIVE_URLS_FILE" ]]; then
    sed -i '' "s|nlsqlLiteFe: '[^']*'|nlsqlLiteFe: '$LIVE_URL'|" "$LIVE_URLS_FILE"
    echo "==> Portfolio live-urls.js updated: nlsqlLiteFe = $LIVE_URL"
  else
    echo "WARN: $LIVE_URLS_FILE not found — update manually."
  fi
else
  echo "WARN: Could not parse Vercel URL from deploy output — update live-urls.js manually."
fi

echo ""
echo "==> Live at $LIVE_URL"
echo "    To suspend: bash $REPO_DIR/infra-down.sh"
