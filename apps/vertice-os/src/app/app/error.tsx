"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="error-state" role="alert">
      <h1>Não conseguimos carregar esta página.</h1>
      <p>
        Verifique sua conexão e tente novamente. Se o problema continuar, fale
        com o administrador.
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </section>
  );
}
