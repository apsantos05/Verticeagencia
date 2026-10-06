"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="access-pending">
      <h1>Não foi possível abrir seu workspace.</h1>
      <p>
        Tente novamente ou peça ao administrador para verificar a conexão e as
        migrations.
      </p>
      <button className="button button-primary" onClick={reset}>
        Tentar novamente
      </button>
      <a href="/login">Voltar ao login</a>
    </main>
  );
}
