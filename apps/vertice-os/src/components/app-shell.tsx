"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  LayoutDashboard,
  Contact,
  FileText,
  Users,
  CalendarDays,
  Layers,
  CheckSquare,
  Wallet,
  BarChart3,
  FolderOpen,
  Settings,
  Plus,
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  ArrowUpRight,
  Video,
  CircleHelp,
  type LucideIcon,
} from "lucide-react";
import { Brand } from "./brand";
import { Button } from "./ui/button";
import { logout } from "@/app/auth/actions";
import {
  canReadCommercial,
  canReadFinance,
  roleLabels,
  type Role,
} from "@/lib/permissions";

type Notification = { id: string; title: string; body: string };
type Props = {
  children: React.ReactNode;
  workspaceName: string;
  name: string;
  role: Role;
  notifications: Notification[];
  notificationsError?: boolean;
};
export function AppShell({
  children,
  workspaceName,
  name,
  role,
  notifications,
  notificationsError,
}: Props) {
  const path = usePathname();
  const [mobile, setMobile] = useState(false);
  const groups: {
    label: string;
    visible: boolean;
    items: [string, LucideIcon][];
  }[] = [
    {
      label: "COMERCIAL",
      visible: canReadCommercial(role),
      items: [
        ["CRM", Contact],
        ["Propostas", FileText],
      ],
    },
    {
      label: "OPERAÇÃO",
      visible: role !== "financeiro",
      items: [
        ["Clientes", Users],
        ["Conteúdo", Video],
        ["Agenda", CalendarDays],
        ["Projetos", Layers],
        ["Tarefas", CheckSquare],
      ],
    },
    {
      label: "GESTÃO",
      visible: canReadFinance(role) || canReadCommercial(role),
      items: canReadFinance(role)
        ? [
            ["Financeiro", Wallet],
            ["Relatórios", BarChart3],
          ]
        : [["Relatórios", BarChart3]],
    },
    {
      label: "EMPRESA",
      visible: true,
      items: ["owner", "admin"].includes(role)
        ? [
            ["Equipe", Users],
            ["Arquivos", FolderOpen],
          ]
        : [["Arquivos", FolderOpen]],
    },
  ];
  const navigation = (
    <>
      <Link
        href="/app"
        className="sidebar-brand"
        onClick={() => setMobile(false)}
      >
        <Brand />
      </Link>
      <div className="workspace-switch">
        <span className="workspace-avatar">V</span>
        <span>
          <strong>{workspaceName}</strong>
          <small>Workspace da agência</small>
        </span>
        <ChevronDown size={14} />
      </div>
      <nav aria-label="Navegação principal">
        <Link
          href="/app"
          onClick={() => setMobile(false)}
          className={`nav-item ${path === "/app" ? "active" : ""}`}
        >
          <LayoutDashboard size={18} />
          Dashboard
          <span className="active-dot" />
        </Link>
        {groups
          .filter((g) => g.visible)
          .map((group) => (
            <div className="nav-group" key={group.label}>
              <p>
                {group.label}
                <span>EM BREVE</span>
              </p>
              {group.items.map(([label, Icon]) => (
                <button
                  key={String(label)}
                  className="nav-item unavailable"
                  type="button"
                  disabled
                  title="Disponível em uma próxima fase"
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          ))}
      </nav>
      <div className="sidebar-bottom">
        <Link
          href="/app/configuracoes"
          onClick={() => setMobile(false)}
          className={`nav-item ${path.includes("configuracoes") ? "active" : ""}`}
        >
          <Settings size={18} />
          Configurações
        </Link>
        <div className="sidebar-note">
          <span className="orange-dot" /> Seu próximo nível, organizado.
        </div>
      </div>
    </>
  );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Ir para o conteúdo
      </a>
      <aside className="sidebar">{navigation}</aside>
      <Dialog.Root open={mobile} onOpenChange={setMobile}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="mobile-sidebar">
            <Dialog.Title className="sr-only">Menu da agência</Dialog.Title>
            <Dialog.Description className="sr-only">
              Navegação do workspace Vértice.
            </Dialog.Description>
            <Dialog.Close className="mobile-close" aria-label="Fechar menu">
              <X size={22} />
            </Dialog.Close>
            {navigation}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="app-body">
        <header className="app-header">
          <Button
            variant="ghost"
            size="icon"
            className="mobile-toggle"
            onClick={() => setMobile(true)}
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </Button>
          <div
            className="global-search"
            title="A busca global será liberada com os módulos operacionais"
          >
            <Search size={18} />
            <span>Busca global</span>
            <span className="search-hint">Em breve</span>
          </div>
          <div className="header-actions">
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button>
                  <Plus size={17} />
                  <span>Novo</span>
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="dialog-overlay" />
                <Dialog.Content className="dialog-card">
                  <Dialog.Title>Um novo começo</Dialog.Title>
                  <Dialog.Description>
                    Os cadastros serão liberados nas próximas etapas do Vértice
                    OS.
                  </Dialog.Description>
                  <div className="new-grid">
                    {[
                      ...(canReadCommercial(role)
                        ? ["Novo lead", "Novo cliente"]
                        : []),
                      ...(role !== "financeiro"
                        ? [
                            "Novo conteúdo",
                            "Nova tarefa",
                            "Novo projeto",
                            "Novo evento",
                          ]
                        : []),
                      ...(canReadFinance(role)
                        ? ["Nova receita", "Nova despesa"]
                        : []),
                    ].map((label) => (
                      <button type="button" key={label} disabled>
                        <Plus size={16} />
                        {label}
                        <small>Em breve</small>
                      </button>
                    ))}
                  </div>
                  <Dialog.Close asChild>
                    <Button variant="outline">Entendido</Button>
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Notificações"
                  className="notification-button"
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className="notification-dot" />
                  )}
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="dialog-overlay" />
                <Dialog.Content className="dialog-card">
                  <Dialog.Title>Notificações</Dialog.Title>
                  <Dialog.Description>
                    Atualizações recentes do seu workspace.
                  </Dialog.Description>
                  {notificationsError ? (
                    <p role="alert" className="notice">
                      Não foi possível carregar as notificações. Atualize a
                      página para tentar novamente.
                    </p>
                  ) : notifications.length ? (
                    <ul className="notification-list">
                      {notifications.map((n) => (
                        <li key={n.id}>
                          <strong>{n.title}</strong>
                          <p>{n.body}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="empty-state">
                      <Bell size={24} />
                      <strong>Tudo tranquilo por aqui</strong>
                      <p>Suas próximas atualizações aparecerão aqui.</p>
                    </div>
                  )}
                  <Dialog.Close asChild>
                    <Button variant="outline">Fechar</Button>
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <div className="header-divider" />
            <div className="profile-chip">
              <span className="user-avatar">
                {name.slice(0, 1).toUpperCase()}
              </span>
              <span>
                <strong>{name}</strong>
                <small>{roleLabels[role]}</small>
              </span>
            </div>
            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label="Sair da conta"
              >
                <LogOut size={18} />
              </Button>
            </form>
          </div>
        </header>
        <main id="main-content" className="main-content">
          {children}
        </main>
        <footer className="app-footer">
          <span>
            VÉRTICE OS <span className="footer-dot">•</span> Espaço para fazer
            acontecer.
          </span>
          <span>
            <CircleHelp size={14} /> Fundação · v0.1 <ArrowUpRight size={14} />
          </span>
        </footer>
      </div>
    </div>
  );
}
