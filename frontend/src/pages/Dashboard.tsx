import { useState } from "react";

import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";

import BrandLogo from "../components/BrandLogo";
import Clients from "./Clients";
import Services from "./Services";

import "./Dashboard.css";

type DashboardProps = {
  userEmail: string;
  onLogout: () => Promise<void>;
};

type DashboardSection =
  | "overview"
  | "clients"
  | "services";

function Dashboard({
  userEmail,
  onLogout,
}: DashboardProps) {
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("overview");

  const currentDate = new Intl.DateTimeFormat(
    "pt-BR",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(new Date());

  const userInitial = userEmail
    .charAt(0)
    .toUpperCase();

  return (
    <div className="dashboard">
      <div className="dashboard-shape shape-blue" />
      <div className="dashboard-shape shape-green" />

      <aside className="dashboard-sidebar">
        <div className="dashboard-brand-area">
          <BrandLogo />
        </div>

        <nav className="dashboard-navigation">
          <button
            type="button"
            className={`dashboard-nav-item ${
              activeSection === "overview"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveSection("overview")
            }
          >
            <LayoutDashboard size={20} />
            <span>Visão geral</span>
          </button>

          <button
            type="button"
            className="dashboard-nav-item"
          >
            <CalendarDays size={20} />
            <span>Agenda</span>
          </button>

          <button
            type="button"
            className={`dashboard-nav-item ${
              activeSection === "clients"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveSection("clients")
            }
          >
            <Users size={20} />
            <span>Clientes</span>
          </button>

          <button
            type="button"
            className={`dashboard-nav-item ${
              activeSection === "services"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveSection("services")
            }
          >
            <BriefcaseBusiness size={20} />
            <span>Serviços</span>
          </button>

          <button
            type="button"
            className="dashboard-nav-item"
          >
            <Settings size={20} />
            <span>Configurações</span>
          </button>
        </nav>

        <div className="dashboard-account">
          <div className="dashboard-avatar">
            {userInitial}
          </div>

          <div className="dashboard-user-data">
            <strong>Minha conta</strong>
            <span>{userEmail}</span>
          </div>

          <button
            type="button"
            className="dashboard-logout"
            onClick={onLogout}
            aria-label="Sair da conta"
            title="Sair da conta"
          >
            <LogOut size={19} />
          </button>
        </div>
      </aside>

      <main className="dashboard-content">
        {activeSection === "overview" ? (
          <>
            <header className="dashboard-header">
              <div className="dashboard-welcome">
                <p className="dashboard-date">
                  {currentDate}
                </p>

                <h2>Visão geral</h2>

                <p className="dashboard-description">
                  Organize seu dia e acompanhe
                  seus agendamentos.
                </p>
              </div>

              <div className="dashboard-header-actions">
                <button
                  type="button"
                  className="notification-button"
                  aria-label="Notificações"
                >
                  <Bell size={20} />
                  <span />
                </button>

                <button
                  type="button"
                  className="primary-dashboard-button"
                >
                  <Plus size={20} />
                  Novo agendamento
                </button>
              </div>
            </header>

            <section className="dashboard-summary">
              <article className="summary-card">
                <div className="summary-icon blue">
                  <Clock3 size={23} />
                </div>

                <div className="summary-information">
                  <span>
                    Agendamentos hoje
                  </span>

                  <strong>0</strong>

                  <small>
                    Nenhum para hoje
                  </small>
                </div>
              </article>

              <article className="summary-card">
                <div className="summary-icon purple">
                  <CalendarRange size={23} />
                </div>

                <div className="summary-information">
                  <span>Esta semana</span>

                  <strong>0</strong>

                  <small>
                    Próximos sete dias
                  </small>
                </div>
              </article>

              <article className="summary-card">
                <div className="summary-icon orange">
                  <Users size={23} />
                </div>

                <div className="summary-information">
                  <span>
                    Total de clientes
                  </span>

                  <strong>0</strong>

                  <small>
                    Clientes cadastrados
                  </small>
                </div>
              </article>

              <article className="summary-card">
                <div className="summary-icon green">
                  <CheckCircle2 size={23} />
                </div>

                <div className="summary-information">
                  <span>Concluídos</span>

                  <strong>0</strong>

                  <small>Neste mês</small>
                </div>
              </article>
            </section>

            <section className="dashboard-main-grid">
              <article className="dashboard-panel appointments-panel">
                <div className="dashboard-panel-header">
                  <div>
                    <h3>
                      Próximos agendamentos
                    </h3>

                    <p>
                      Seus compromissos mais
                      próximos
                    </p>
                  </div>

                  <button
                    type="button"
                    className="panel-link"
                  >
                    Ver agenda
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div className="dashboard-empty-state">
                  <div className="empty-icon">
                    <CalendarDays size={29} />
                  </div>

                  <h4>Sua agenda está livre</h4>

                  <p>
                    Você ainda não possui
                    compromissos cadastrados.
                  </p>

                  <button
                    type="button"
                    className="secondary-dashboard-button"
                  >
                    <Plus size={18} />
                    Criar primeiro agendamento
                  </button>
                </div>
              </article>

              <aside className="dashboard-panel quick-panel">
                <div className="dashboard-panel-header">
                  <div>
                    <h3>Ações rápidas</h3>

                    <p>
                      Acesse as principais funções
                    </p>
                  </div>
                </div>

                <div className="quick-actions-list">
                  <button
                    type="button"
                    className="quick-action"
                  >
                    <span className="quick-action-icon blue">
                      <CalendarDays size={20} />
                    </span>

                    <span className="quick-action-text">
                      <strong>
                        Novo agendamento
                      </strong>

                      <small>
                        Cadastre um compromisso
                      </small>
                    </span>

                    <ArrowRight
                      className="quick-action-arrow"
                      size={17}
                    />
                  </button>

                  <button
                    type="button"
                    className="quick-action"
                    onClick={() =>
                      setActiveSection("clients")
                    }
                  >
                    <span className="quick-action-icon green">
                      <UserPlus size={20} />
                    </span>

                    <span className="quick-action-text">
                      <strong>
                        Novo cliente
                      </strong>

                      <small>
                        Adicione um novo cliente
                      </small>
                    </span>

                    <ArrowRight
                      className="quick-action-arrow"
                      size={17}
                    />
                  </button>

                  <button
                    type="button"
                    className="quick-action"
                    onClick={() =>
                      setActiveSection("services")
                    }
                  >
                    <span className="quick-action-icon purple">
                      <BriefcaseBusiness
                        size={20}
                      />
                    </span>

                    <span className="quick-action-text">
                      <strong>
                        Novo serviço
                      </strong>

                      <small>
                        Cadastre um novo serviço
                      </small>
                    </span>

                    <ArrowRight
                      className="quick-action-arrow"
                      size={17}
                    />
                  </button>
                </div>
              </aside>
            </section>
          </>
        ) : activeSection === "clients" ? (
          <Clients />
        ) : (
          <Services />
        )}
      </main>
    </div>
  );
}

export default Dashboard;