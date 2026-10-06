import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCheck,
  Clock3,
  Layers,
  Sparkles,
  Users,
  Wallet,
  CircleCheck,
  FileCheck2,
} from "lucide-react";
import { canReadOperations, type Role } from "@/lib/permissions";
import type { DashboardData } from "@/lib/dashboard";
import { money } from "@/lib/utils";
type Props = { data: DashboardData; name: string; role: Role; now: string };
function Metric({
  label,
  value,
  note,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: typeof Wallet;
  accent?: boolean;
}) {
  return (
    <article className={`metric-card ${accent ? "metric-accent" : ""}`}>
      <div className="metric-label">
        {label}
        <span className="metric-icon">
          <Icon size={17} />
        </span>
      </div>
      <strong className="metric-value">{value}</strong>
      <p>{note}</p>
    </article>
  );
}
function ListPanel({
  title,
  eyebrow,
  icon: Icon,
  emptyTitle,
  emptyText,
  items,
}: {
  title: string;
  eyebrow: string;
  icon: typeof Wallet;
  emptyTitle: string;
  emptyText: string;
  items: { id: string; title: string; detail: string }[];
}) {
  return (
    <section className="list-panel">
      <div className="panel-heading">
        <span className="panel-icon">
          <Icon size={19} />
        </span>
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h3>{title}</h3>
        </div>
        <span className="count-badge">{items.length}</span>
      </div>
      {items.length ? (
        <ul className="dashboard-list">
          {items.map((item) => (
            <li key={item.id}>
              <span className="list-dot" />
              <div>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <Icon size={26} strokeWidth={1.4} />
          <strong>{emptyTitle}</strong>
          <p>{emptyText}</p>
        </div>
      )}
    </section>
  );
}
export function DashboardView({ data, name, role, now }: Props) {
  const date = new Date(now);
  const format = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(value));
  const todayKey = date.toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
  const todayEvents = data.agenda.filter(
    (e) =>
      new Date(e.starts_at).toLocaleDateString("en-CA", {
        timeZone: "America/Sao_Paulo",
      }) === todayKey,
  );
  const nextEvents = data.agenda.filter(
    (e) => !todayEvents.some((t) => t.id === e.id),
  );
  const f = data.finance;
  return (
    <>
      <div className="breadcrumb">
        Workspace <span>/</span> <strong>Dashboard</strong>
      </div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">VISÃO GERAL</span>
          <h1>
            Vamos fazer acontecer, {name.split(" ")[0]}
            <span className="hot">.</span>
          </h1>
          <p>Uma visão clara da sua agência. Tudo na mesma direção.</p>
        </div>
        <div className="date-chip">
          <CalendarDays size={17} />
          {date.toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "America/Sao_Paulo",
          })}
        </div>
      </div>
      <section className="overview-banner">
        <div className="banner-icon">
          <Sparkles size={22} />
        </div>
        <div>
          <strong>Clareza para criar. Espaço para crescer.</strong>
          <p>
            Seu workspace está pronto para acompanhar os próximos passos da
            Vértice.
          </p>
        </div>
        <span className="live-badge">
          <span /> Dados do workspace
        </span>
      </section>
      {f && (
        <section aria-label="Resumo financeiro">
          <div className="section-heading">
            <h2>Saúde financeira</h2>
            <span>
              Competência e caixa ·{" "}
              {date.toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
                timeZone: "America/Sao_Paulo",
              })}
            </span>
          </div>
          <div className="metrics-grid finance-grid">
            <Metric
              label="Receita prevista"
              value={money(f.expected)}
              note="Por competência do mês"
              icon={Wallet}
              accent
            />
            <Metric
              label="Receita recebida"
              value={money(f.received)}
              note="Entradas de caixa no mês"
              icon={ArrowDownLeft}
            />
            <Metric
              label="A receber"
              value={money(f.outstanding)}
              note="Saldo aberto · todas as competências"
              icon={Clock3}
            />
            <Metric
              label="Recebimentos atrasados"
              value={money(f.overdue)}
              note="Saldo vencido · todas as competências"
              icon={Clock3}
            />
            <Metric
              label="Despesas"
              value={money(f.expenses)}
              note="Por competência do mês"
              icon={ArrowUpRight}
            />
            <Metric
              label="Lucro estimado"
              value={money(f.expected - f.expenses)}
              note="Receita prevista menos despesas do mês"
              icon={Wallet}
            />
          </div>
        </section>
      )}
      {canReadOperations(role) && (
        <section aria-label="Resumo da operação">
          <div className="section-heading">
            <h2>A operação em movimento</h2>
            <span>
              {["owner", "admin", "gestor"].includes(role)
                ? "Visão da equipe"
                : "Itens atribuídos a você"}
            </span>
          </div>
          <div className="metrics-grid operation-grid">
            <Metric
              label="Clientes ativos"
              value={data.operations.clients}
              note="Relacionamentos em andamento"
              icon={Users}
            />
            <Metric
              label="Conteúdos planejados"
              value={data.operations.content}
              note="Previstos para este mês"
              icon={Layers}
            />
            <Metric
              label="Aguardando aprovação"
              value={data.operations.approvals}
              note={`${data.operations.lateContent} conteúdo(s) com prazo vencido`}
              icon={FileCheck2}
            />
            <Metric
              label="Tarefas pendentes"
              value={data.operations.tasks}
              note={`${data.operations.projects} projeto(s) · ${data.operations.websites} site(s) ativos`}
              icon={CheckCheck}
            />
          </div>
        </section>
      )}
      <div className="dashboard-panels">
        <ListPanel
          title="Agenda de hoje"
          eyebrow="SEU DIA"
          icon={CalendarDays}
          emptyTitle="Um espaço livre na agenda"
          emptyText="Seus compromissos de hoje aparecerão aqui."
          items={todayEvents.map((e) => ({
            ...e,
            detail: format(e.starts_at),
          }))}
        />
        {canReadOperations(role) ? (
          <ListPanel
            title="Precisam da sua atenção"
            eyebrow="TAREFAS ATRASADAS"
            icon={Clock3}
            emptyTitle="Nenhuma tarefa atrasada"
            emptyText="Quando um prazo vencer, ele será destacado aqui."
            items={data.lateTasks.map((t) => ({
              ...t,
              detail: format(t.due_at),
            }))}
          />
        ) : (
          <ListPanel
            title="Contas a receber"
            eyebrow="VENCIMENTOS E ATRASOS"
            icon={Wallet}
            emptyTitle="Nenhuma cobrança em aberto"
            emptyText="As contas e seus saldos aparecerão aqui."
            items={data.dueAccounts.map((r) => ({
              ...r,
              detail: `${r.due_date.split("-").reverse().join("/")} · ${money(r.balance)}`,
            }))}
          />
        )}
      </div>
      {data.commercial && (
        <section className="pipeline-panel">
          <div className="section-heading">
            <h2>O próximo capítulo começa no comercial</h2>
            <span>
              Pipeline aberto <strong>{money(data.commercial.pipeline)}</strong>
            </span>
          </div>
          <div className="pipeline-stats">
            {[
              ["Novos leads", data.commercial.newLeads],
              ["Reuniões", data.commercial.meetings],
              ["Propostas enviadas", data.commercial.proposals],
              ["Negociações", data.commercial.negotiations],
              ["Leads fechados", data.commercial.won],
            ].map(([label, value], i) => (
              <div key={label}>
                <span className="pipeline-step">0{i + 1}</span>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="dashboard-panels">
        <ListPanel
          title="Próximos compromissos"
          eyebrow="NO HORIZONTE"
          icon={CalendarDays}
          emptyTitle="Sem compromissos futuros"
          emptyText="Reuniões, gravações e entregas, no mesmo lugar."
          items={nextEvents.map((e) => ({ ...e, detail: format(e.starts_at) }))}
        />
        {canReadOperations(role) && (
          <ListPanel
            title="Aprovações de conteúdo"
            eyebrow="PRÓXIMO PASSO"
            icon={CircleCheck}
            emptyTitle="Nenhuma aprovação pendente"
            emptyText="Os conteúdos enviados ao cliente aparecerão aqui."
            items={data.approvals.map((c) => ({
              ...c,
              detail: c.scheduled_at
                ? format(c.scheduled_at)
                : "Sem data prevista",
            }))}
          />
        )}
      </div>
      {canReadOperations(role) && (
        <div className="dashboard-panels">
          <ListPanel
            title="Próximas entregas"
            eyebrow="PROJETOS"
            icon={Layers}
            emptyTitle="Nenhuma entrega prevista"
            emptyText="Os prazos dos projetos aparecerão aqui."
            items={data.deliveries.map((p) => ({
              ...p,
              detail: format(p.due_at),
            }))}
          />
          {f && (
            <ListPanel
              title="Contas a receber"
              eyebrow="VENCIMENTOS E ATRASOS"
              icon={Wallet}
              emptyTitle="Nenhuma cobrança em aberto"
              emptyText="As contas e seus saldos aparecerão aqui."
              items={data.dueAccounts.map((r) => ({
                ...r,
                detail: `${r.due_date.split("-").reverse().join("/")} · ${money(r.balance)}`,
              }))}
            />
          )}
        </div>
      )}
    </>
  );
}
