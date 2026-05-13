# natral-language-to-query-comparison

A lightweight, browser-only app to compare natural-language-to-SQL generation behavior across LLM providers (Anthropic and OpenAI), then execute generated SQL with DuckDB-WASM on a Parquet dataset.

## What It Does

- Loads data directly from a Parquet URL.
- Includes schema auto-detection from parquet metadata.
- Translates natural language into SQL using either Anthropic or OpenAI chat models.
- Enforces structured model output (`sql` + one-line `explanation`) for reliable parsing.
- Runs generated SQL locally in-browser using DuckDB-WASM.
- Provides grouped sample queries to compare model behavior quickly.

## Project Structure

- `nl_to_sql.html`: complete UI + app logic (no build step).
- `public/legacy/nl_to_sql.html`: untouched copy of the legacy app served by Vite.
- `src/`: React 19 migration shell.
- `index.html`: Vite entry HTML for the React app.
- `.gitignore`: local ignores.

## React 19 App

This repository now includes a componentized React 19 + Vite app.

- Home route (`/`) runs the React implementation.
- Legacy route (`/legacy/nl_to_sql.html`) serves the preserved original HTML app.
- The React header includes an "Open Original HTML" button to launch the untouched legacy page in a new tab at any time.

### Run React App

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Build production assets: `npm run build`
4. Preview build: `npm run preview`

## How To Run

1. Open `nl_to_sql.html` in a modern browser.
2. Set the Parquet endpoint and table alias.
3. Add your API key.
4. Pick model + SQL dialect.
5. Enter a natural-language query and click **Translate + Run**.

## Notes

- API calls are made directly from the browser to the selected provider.
- The API key is persisted in `localStorage` for convenience.
- DuckDB runs locally in-browser; no backend is required.

## Good For

- Prompt iteration for NL→SQL tasks.
- Quick side-by-side model behavior checks.
- Schema-aware SQL generation experiments.

## Future Improvements

- Add provider abstraction with pluggable adapters.
- Add saved query history and export.
- Add repeatable evaluation set with scoring metrics.
- Add backend proxy mode for safer key handling.
