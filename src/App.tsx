// src/App.tsx

import { Header } from "./layout"
import { Sheet } from "./ui"
import "./index.css"

export function App() {
  return (
    <main className="app">
      <Header />
      <section className="sheet" aria-label="Deduction sheet">
        <Sheet />
      </section>
    </main>
  )
}