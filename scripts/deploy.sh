#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$REPO_DIR/.env.local"

# ── Helpers ───────────────────────────────────────────────────────────────────

_prompt_secret() {
  local key="$1" prompt_text="$2"
  if [[ -z "${!key:-}" ]]; then
    printf "%s: " "$prompt_text"
    read -rs value
    echo
    eval "export $key=\"\$value\""
    echo "$key=$value" >> "$ENV_FILE"
  fi
}

_push_env() {
  local key="$1"
  local val="${!key:-}"
  [[ -n "$val" ]] || return 0
  vercel env rm "$key" production --yes --token "$VERCEL_TOKEN" 2>/dev/null || true
  printf "%s" "$val" | vercel env add "$key" production --token "$VERCEL_TOKEN"
  echo "    $key set"
}

# ── Preflight ─────────────────────────────────────────────────────────────────

_run_preflight() {
  cd "$REPO_DIR"

  if ! command -v vercel &>/dev/null; then
    echo "==> vercel CLI not found — installing globally..."
    npm install -g vercel
  fi

  [[ -f "$ENV_FILE" ]] || touch "$ENV_FILE"

  set -o allexport
  source "$ENV_FILE"
  set +o allexport

  _prompt_secret VERCEL_TOKEN        "Vercel token — https://vercel.com/account/tokens → Create → scope: Full Account"
  _prompt_secret ANTHROPIC_API_KEY   "Anthropic API key — https://console.anthropic.com/settings/keys (sk-ant-...)"
  _prompt_secret OPENAI_API_KEY      "OpenAI API key — https://platform.openai.com/api-keys (sk-...)"
  _prompt_secret GOOGLE_API_KEY      "Google API key — https://aistudio.google.com/app/apikey (AIza...)"
  _prompt_secret RESEND_API_KEY      "Resend API key — https://resend.com/api-keys → Create API Key (re_...)"
  _prompt_secret UPSTASH_REDIS_REST_URL    "Upstash Redis REST URL — https://vercel.com/dashboard → Integrations → Upstash → your store → .env.local tab → UPSTASH_REDIS_REST_URL"
  _prompt_secret UPSTASH_REDIS_REST_TOKEN  "Upstash Redis REST token — same .env.local tab → UPSTASH_REDIS_REST_TOKEN"

  export VERCEL_TOKEN
}

# ── Deploy ────────────────────────────────────────────────────────────────────

_deploy() {
  echo "==> nl-sql deploy"
  echo "==> Vercel identity: $(vercel whoami --token "$VERCEL_TOKEN")"

  echo "==> npm install"
  npm install

  echo "==> Pushing env vars to Vercel production..."
  _push_env ANTHROPIC_API_KEY
  _push_env OPENAI_API_KEY
  _push_env GOOGLE_API_KEY
  _push_env RESEND_API_KEY
  _push_env UPSTASH_REDIS_REST_URL
  _push_env UPSTASH_REDIS_REST_TOKEN

  vercel env rm SUSPENDED production --yes --token "$VERCEL_TOKEN" 2>/dev/null || true

  echo "==> Deploying to production..."
  local DEPLOY_OUT
  DEPLOY_OUT=$(vercel --prod --yes --token "$VERCEL_TOKEN" 2>&1)
  echo "$DEPLOY_OUT"

  local VERCEL_URL="https://natural-language-to-llm-query-comparison.vercel.app"

  echo ""
  echo "==> Live at $VERCEL_URL"
  echo "    To suspend: bash $REPO_DIR/infra-down.sh"
}

# ── Main ──────────────────────────────────────────────────────────────────────

_run_preflight
_deploy
