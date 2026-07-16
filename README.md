# natural-language-to-llm-query-comparison

A lightweight app to compare natural-language-to-SQL generation behavior across LLM providers (Anthropic, OpenAI, and Google), then execute generated SQL with DuckDB-WASM on a Parquet dataset.

**[→ Portfolio demo](https://bganguly.github.io/?open=nlsql)**

## Using the App

1. The default dataset is DOL H1B LCA disclosures (Parquet) — or set any public Parquet URL as the endpoint; schema is auto-detected from metadata.
2. Pick a provider (Anthropic / OpenAI / Google), enter a natural-language query, and click **Translate + Run**.
3. The generated SQL executes in-browser via DuckDB-WASM — no backend needed. Switch providers to compare SQL output side by side.

## What This Repo Does

- Loads data directly from a Parquet URL (any parquet endpoint can be set — the app auto-detects schema).
- Includes schema auto-detection from parquet metadata.
- Translates natural language into SQL using Anthropic, OpenAI, or Google chat models.
- Runs generated SQL locally in-browser using DuckDB-WASM.
- Provides grouped sample queries to compare model behavior across providers.

![screenshot](docs/screenshot.png)

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- API key(s) for one or more providers — having all three lets you compare side by side:
  - [Anthropic](https://console.anthropic.com/settings/keys) (`sk-ant-...`)
  - [OpenAI](https://platform.openai.com/api-keys) (`sk-...`)
  - [Google AI Studio](https://aistudio.google.com/app/apikey) (`AIza...`)
- A running Parquet endpoint — the default is an H1B dataset; any public parquet URL works

## How To Run

**React app (default):**
1. `npm i && npm run dev`
2. Open `http://localhost:5173/nl-to-sql/` in a modern browser.
3. Set the Parquet endpoint and table alias (or use the default).
4. Choose **Key source**: `predefined` (uses server-side keys on Vercel) or `own-key` (enter your own).
5. Pick a provider + model + SQL dialect, enter a natural-language query, and click **Translate + Run**.

**Legacy HTML app (no build step):**
1. Open `public/legacy/nl_to_sql.html` directly in a browser, or use the "Open Original HTML" button in the React app header.

## Notes

- API calls are made directly from the browser to the selected provider.
- The API key is persisted in `localStorage` for convenience.
- DuckDB runs locally in-browser; no backend is required.

## Future Potential Improvements

### Additional LLM Providers

The app supports Anthropic, OpenAI, and Google. Other providers that could be integrated:

| Provider | Models | Notes |
|---|---|---|
| **Mistral** | Mistral Large, Codestral | Codestral is fine-tuned for code/SQL; OpenAI-compatible API — minimal changes needed |
| **Groq** | Llama 3.3 70B, Mixtral | Very low latency inference; drop-in OpenAI-compatible API |
| **xAI** | Grok 3 | OpenAI-compatible API |
| **Meta (via Together/Fireworks)** | Llama 3.3 70B | Open weights hosted with OpenAI-compatible APIs |

Providers with OpenAI-compatible APIs (Groq, Mistral, xAI, Together, Fireworks) could be added by extending the model list and changing the base URL, reusing the existing OpenAI code path.


