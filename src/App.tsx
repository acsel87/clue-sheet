export function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Clue Sheet</h1>
        <p className="app__subtitle">PWA • Local-only • Advanced deduction</p>
      </header>

      <main className="app__main">
        <section className="card">
          <h2 className="card__title">Next steps</h2>
          <ol className="card__list">
            <li>Implement state + storage (transactional localStorage)</li>
            <li>Implement rule engine (✅/❌/unknown sets/Public)</li>
            <li>Build the grid UI</li>
          </ol>
        </section>
      </main>
    </div>
  )
}