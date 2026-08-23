import { Link, Route, Routes } from 'react-router';
import { Suspense } from 'react';
import { prototypes } from './prototypes';

function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Eldrin UI Playground</h1>
      <p className="mt-2 text-sm text-gray-600">
        Prototypes exercise <code>eldrin-ui</code> live from{' '}
        <code>packages/eldrin-ui</code> — no publish step. See{' '}
        <code>CLAUDE.md</code> for what belongs here vs. what belongs back in
        the design system.
      </p>
      <ul className="mt-6 flex flex-col gap-2">
        {prototypes.map((p) => (
          <li key={p.slug}>
            <Link className="font-medium underline" to={`/${p.slug}`}>
              {p.title}
            </Link>
            <span className="ml-2 text-sm text-gray-600">{p.description}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}

function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Home />} />
        {prototypes.map((p) => (
          <Route key={p.slug} path={`/${p.slug}`} element={<p.Component />} />
        ))}
      </Routes>
    </Suspense>
  );
}

export default App;
