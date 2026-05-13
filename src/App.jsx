export default function App() {
  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">React 19 Migration Shell</p>
        <h1>NL to SQL Playground</h1>
        <p className="lead">
          Your original HTML app is preserved exactly and embedded below. This React shell is now ready for incremental component migration.
        </p>
      </header>

      <section className="card actions">
        <a className="btn" href="/legacy/nl_to_sql.html" target="_blank" rel="noreferrer">
          Open Legacy App In New Tab
        </a>
        <span className="hint">Source of truth remains the original HTML during migration.</span>
      </section>

      <section className="card viewer">
        <h2>Legacy App Preview</h2>
        <iframe
          title="Legacy NL to SQL App"
          src="/legacy/nl_to_sql.html"
          className="legacy-frame"
        />
      </section>
    </main>
  );
}
