import Link from "next/link";
export default function NotFound() {
  return (
    <main className="access-pending">
      <span className="eyebrow">404</span>
      <h1>Este caminho ainda não existe.</h1>
      <p>Volte ao seu workspace para continuar.</p>
      <Link className="button button-primary" href="/app">
        Ir para o dashboard
      </Link>
    </main>
  );
}
