import { Brand } from "@/components/brand";
import { ArrowUpRight } from "lucide-react";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <Brand />
        <div className="auth-story-copy">
          <span className="eyebrow">
            <span className="orange-dot" /> O SEU CENTRO DE OPERAÇÃO
          </span>
          <h1>
            Boas ideias.
            <br />
            Grandes entregas.
            <br />
            <em>Uma só direção.</em>
          </h1>
          <p>
            Do primeiro contato à próxima conquista.
            <br />
            Tudo o que move a Vértice, no mesmo lugar.
          </p>
        </div>
        <div className="peak-art" aria-hidden="true">
          <svg viewBox="0 0 700 240">
            <path d="M-20 220 120 185 195 198 320 75 375 123 500 5 725 230" />
            <path d="M-20 245 120 210 195 223 320 100 375 148 500 30 725 255" />
            <path d="M-20 270 120 235 195 248 320 125 375 173 500 55 725 280" />
          </svg>
        </div>
        <footer>
          <span>ESTRATÉGIA. CRIATIVIDADE. RESULTADO.</span>
          <ArrowUpRight size={20} />
        </footer>
      </section>
      <section className="auth-panel">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <div className="auth-card">{children}</div>
        <p className="auth-footer">
          Vértice Agência · Acesso exclusivo da equipe
        </p>
      </section>
    </main>
  );
}
