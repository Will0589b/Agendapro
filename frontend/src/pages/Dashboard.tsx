import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  CheckCheck,
  Clock3,
  Inbox,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Plus,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";

import BrandLogo from "../components/BrandLogo";
import { supabase } from "../lib/supabase";
import Appointments from "./Appointments";
import Clients from "./Clients";
import Services from "./Services";
import SettingsPage from "./Settings";

import "./Dashboard.css";

type DashboardProps = {
  userEmail: string;
  onLogout: () => Promise<void>;
};

type DashboardSection =
  | "overview"
  | "appointments"
  | "clients"
  | "services"
  | "settings";

type DashboardSummary = {
  today: number;
  nextSevenDays: number;
  clients: number;
  completedThisMonth: number;
};

type UpcomingAppointment = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: "scheduled" | "confirmed";
  client: {
    name: string;
  } | null;
  service: {
    name: string;
  } | null;
};

type DashboardNotification = {
  id: string;
  appointment_id: string | null;
  type: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

const initialSummary: DashboardSummary = {
  today: 0,
  nextSevenDays: 0,
  clients: 0,
  completedThisMonth: 0,
};

function Dashboard({
  userEmail,
  onLogout,
}: DashboardProps) {
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("overview");

  const [summary, setSummary] =
    useState<DashboardSummary>(
      initialSummary
    );

  const [upcomingAppointments, setUpcomingAppointments] =
    useState<UpcomingAppointment[]>([]);

  const [overviewLoading, setOverviewLoading] =
    useState(true);

  const [overviewError, setOverviewError] =
    useState<string | null>(null);

  const [notifications, setNotifications] =
    useState<DashboardNotification[]>([]);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [notificationsLoading, setNotificationsLoading] =
    useState(true);

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

  const openAppointments = () => {
    setNotificationsOpen(false);
    setActiveSection("appointments");
  };

  const unreadNotifications = notifications.filter(
    (notification) => !notification.read_at
  ).length;

  const loadNotifications = useCallback(async () => {
    const { data, error: notificationsError } =
      await supabase
        .from("notifications")
        .select(`
          id,
          appointment_id,
          type,
          title,
          message,
          read_at,
          created_at
        `)
        .order("created_at", {
          ascending: false,
        })
        .limit(8);

    if (notificationsError) {
      console.error(notificationsError);
      setNotificationsLoading(false);
      return;
    }

    setNotifications(
      (data ?? []) as DashboardNotification[]
    );
    setNotificationsLoading(false);
  }, []);

  useEffect(() => {
    void loadNotifications();

    const notificationsChannel = supabase
      .channel("dashboard-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          void loadNotifications();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(
        notificationsChannel
      );
    };
  }, [loadNotifications]);

  const toggleNotifications = () => {
    setNotificationsOpen((current) => !current);
    void loadNotifications();
  };

  const markAllNotificationsAsRead = async () => {
    if (unreadNotifications === 0) {
      return;
    }

    const readAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ read_at: readAt })
      .is("read_at", null);

    if (updateError) {
      console.error(updateError);
      return;
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        read_at: notification.read_at ?? readAt,
      }))
    );
  };

  const openNotification = async (
    notification: DashboardNotification
  ) => {
    if (!notification.read_at) {
      const readAt = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("notifications")
        .update({ read_at: readAt })
        .eq("id", notification.id);

      if (updateError) {
        console.error(updateError);
      } else {
        setNotifications((currentNotifications) =>
          currentNotifications.map((current) =>
            current.id === notification.id
              ? {
                  ...current,
                  read_at: readAt,
                }
              : current
          )
        );
      }
    }

    openAppointments();
  };

  const formatNotificationDate = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));

  useEffect(() => {
    if (activeSection !== "overview") {
      return;
    }

    let isMounted = true;

    const loadOverview = async (
      showLoading = true
    ) => {
      if (showLoading) {
        setOverviewLoading(true);
      }

      setOverviewError(null);

      const now = new Date();

      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      const tomorrowStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );

      const sevenDaysFromNow = new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000
      );

      const monthStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

      const nextMonthStart = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1
      );

      const [
        todayResponse,
        weekResponse,
        clientsResponse,
        completedResponse,
        upcomingResponse,
      ] = await Promise.all([
        supabase
          .from("appointments")
          .select("id", {
            count: "exact",
            head: true,
          })
          .gte(
            "starts_at",
            todayStart.toISOString()
          )
          .lt(
            "starts_at",
            tomorrowStart.toISOString()
          )
          .in("status", [
            "scheduled",
            "confirmed",
            "completed",
          ]),

        supabase
          .from("appointments")
          .select("id", {
            count: "exact",
            head: true,
          })
          .gte("starts_at", now.toISOString())
          .lt(
            "starts_at",
            sevenDaysFromNow.toISOString()
          )
          .in("status", [
            "scheduled",
            "confirmed",
          ]),

        supabase
          .from("clients")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("appointments")
          .select("id", {
            count: "exact",
            head: true,
          })
          .gte(
            "starts_at",
            monthStart.toISOString()
          )
          .lt(
            "starts_at",
            nextMonthStart.toISOString()
          )
          .eq("status", "completed"),

        supabase
          .from("appointments")
          .select(`
            id,
            starts_at,
            ends_at,
            status,
            client:clients!appointments_client_owner_fkey (
              name
            ),
            service:services!appointments_service_owner_fkey (
              name
            )
          `)
          .gte("starts_at", now.toISOString())
          .in("status", [
            "scheduled",
            "confirmed",
          ])
          .order("starts_at", {
            ascending: true,
          })
          .limit(3),
      ]);

      const responses = [
        todayResponse,
        weekResponse,
        clientsResponse,
        completedResponse,
        upcomingResponse,
      ];

      const responseError = responses.find(
        (response) => response.error
      )?.error;

      if (responseError) {
        console.error(responseError);

        if (isMounted) {
          setOverviewError(
            "Não foi possível atualizar a visão geral."
          );
          setOverviewLoading(false);
        }

        return;
      }

      const normalizedUpcoming: UpcomingAppointment[] =
        (upcomingResponse.data ?? []).map(
          (item) => {
            const appointment =
              item as unknown as Omit<
                UpcomingAppointment,
                "client" | "service"
              > & {
                client:
                  | UpcomingAppointment["client"]
                  | UpcomingAppointment["client"][];
                service:
                  | UpcomingAppointment["service"]
                  | UpcomingAppointment["service"][];
              };

            return {
              ...appointment,
              client: Array.isArray(
                appointment.client
              )
                ? appointment.client[0] ?? null
                : appointment.client,
              service: Array.isArray(
                appointment.service
              )
                ? appointment.service[0] ?? null
                : appointment.service,
            };
          }
        );

      if (!isMounted) {
        return;
      }

      setSummary({
        today: todayResponse.count ?? 0,
        nextSevenDays:
          weekResponse.count ?? 0,
        clients: clientsResponse.count ?? 0,
        completedThisMonth:
          completedResponse.count ?? 0,
      });

      setUpcomingAppointments(
        normalizedUpcoming
      );
      setOverviewLoading(false);
    };

    void loadOverview();

    const overviewChannel = supabase
      .channel("dashboard-overview-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        () => {
          void loadOverview(false);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clients",
        },
        () => {
          void loadOverview(false);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(
        overviewChannel
      );
    };
  }, [activeSection]);

  const formatUpcomingDate = (
    value: string
  ) =>
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }).format(new Date(value));

  const formatUpcomingTime = (
    value: string
  ) =>
    new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));

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
            className={`dashboard-nav-item ${
              activeSection === "appointments"
                ? "active"
                : ""
            }`}
            onClick={openAppointments}
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
            className={`dashboard-nav-item ${
              activeSection === "settings"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveSection("settings")
            }
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
                <div className="notification-wrapper">
                  <button
                    type="button"
                    className="notification-button"
                    aria-label="Notificações"
                    aria-expanded={notificationsOpen}
                    aria-controls="dashboard-notifications-panel"
                    onClick={toggleNotifications}
                  >
                    <Bell size={20} />

                    {unreadNotifications > 0 && (
                      <span className="notification-badge">
                        {unreadNotifications > 9
                          ? "9+"
                          : unreadNotifications}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div
                      id="dashboard-notifications-panel"
                      className="notification-panel"
                    >
                      <div className="notification-panel-header">
                        <div>
                          <strong>Notificações</strong>
                          <span>
                            {unreadNotifications === 0
                              ? "Você está em dia"
                              : unreadNotifications === 1
                                ? "1 não lida"
                                : `${unreadNotifications} não lidas`}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={markAllNotificationsAsRead}
                          disabled={unreadNotifications === 0}
                          title="Marcar todas como lidas"
                        >
                          <CheckCheck size={17} />
                          <span>Marcar como lidas</span>
                        </button>
                      </div>

                      <div className="notification-list">
                        {notificationsLoading ? (
                          <div className="notification-empty">
                            <LoaderCircle
                              className="dashboard-loading-icon"
                              size={24}
                            />
                            <span>Carregando...</span>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="notification-empty">
                            <Inbox size={27} />
                            <strong>Nenhuma notificação</strong>
                            <span>
                              Novos agendamentos aparecerão aqui.
                            </span>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <button
                              key={notification.id}
                              type="button"
                              className={`notification-item ${
                                notification.read_at
                                  ? "read"
                                  : "unread"
                              }`}
                              onClick={() =>
                                void openNotification(
                                  notification
                                )
                              }
                            >
                              <span className="notification-item-icon">
                                <CalendarDays size={18} />
                              </span>

                              <span className="notification-item-content">
                                <strong>
                                  {notification.title}
                                </strong>
                                <span>
                                  {notification.message}
                                </span>
                                <small>
                                  {formatNotificationDate(
                                    notification.created_at
                                  )}
                                </small>
                              </span>

                              {!notification.read_at && (
                                <span
                                  className="notification-unread-dot"
                                  aria-label="Não lida"
                                />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="primary-dashboard-button"
                  onClick={openAppointments}
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

                  <strong>
                    {overviewLoading
                      ? "—"
                      : summary.today}
                  </strong>

                  <small>
                    {overviewLoading
                      ? "Atualizando..."
                      : summary.today === 0
                        ? "Nenhum para hoje"
                        : summary.today === 1
                          ? "Compromisso para hoje"
                          : "Compromissos para hoje"}
                  </small>
                </div>
              </article>

              <article className="summary-card">
                <div className="summary-icon purple">
                  <CalendarRange size={23} />
                </div>

                <div className="summary-information">
                  <span>Esta semana</span>

                  <strong>
                    {overviewLoading
                      ? "—"
                      : summary.nextSevenDays}
                  </strong>

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

                  <strong>
                    {overviewLoading
                      ? "—"
                      : summary.clients}
                  </strong>

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

                  <strong>
                    {overviewLoading
                      ? "—"
                      : summary.completedThisMonth}
                  </strong>

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
                    onClick={openAppointments}
                  >
                    Ver agenda
                    <ArrowRight size={16} />
                  </button>
                </div>

                {overviewError ? (
                  <div className="dashboard-empty-state">
                    <div className="empty-icon">
                      <CalendarDays size={29} />
                    </div>

                    <h4>Não foi possível atualizar</h4>
                    <p>{overviewError}</p>
                  </div>
                ) : overviewLoading ? (
                  <div className="dashboard-empty-state">
                    <LoaderCircle
                      className="dashboard-loading-icon"
                      size={30}
                    />
                    <p>Atualizando sua agenda...</p>
                  </div>
                ) : upcomingAppointments.length > 0 ? (
                  <div className="dashboard-upcoming-list">
                    {upcomingAppointments.map(
                      (appointment) => (
                        <button
                          key={appointment.id}
                          type="button"
                          className="dashboard-upcoming-item"
                          onClick={openAppointments}
                        >
                          <span className="dashboard-upcoming-date">
                            <CalendarDays size={18} />
                            <span>
                              <strong>
                                {formatUpcomingDate(
                                  appointment.starts_at
                                )}
                              </strong>
                              <small>
                                {formatUpcomingTime(
                                  appointment.starts_at
                                )}
                                {" - "}
                                {formatUpcomingTime(
                                  appointment.ends_at
                                )}
                              </small>
                            </span>
                          </span>

                          <span className="dashboard-upcoming-data">
                            <strong>
                              {appointment.client
                                ?.name ??
                                "Cliente removido"}
                            </strong>
                            <small>
                              {appointment.service
                                ?.name ??
                                "Serviço removido"}
                            </small>
                          </span>

                          <span
                            className={`dashboard-upcoming-status ${appointment.status}`}
                          >
                            {appointment.status ===
                            "confirmed"
                              ? "Confirmado"
                              : "Agendado"}
                          </span>

                          <ArrowRight size={17} />
                        </button>
                      )
                    )}
                  </div>
                ) : (
                  <div className="dashboard-empty-state">
                    <div className="empty-icon">
                      <CalendarDays size={29} />
                    </div>

                    <h4>Sua agenda está livre</h4>

                    <p>
                      Você não possui compromissos
                      futuros cadastrados.
                    </p>

                    <button
                      type="button"
                      className="secondary-dashboard-button"
                      onClick={openAppointments}
                    >
                      <Plus size={18} />
                      Criar primeiro agendamento
                    </button>
                  </div>
                )}
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
                    onClick={openAppointments}
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
        ) : activeSection ===
          "appointments" ? (
          <Appointments />
        ) : activeSection === "clients" ? (
          <Clients />
        ) : activeSection === "services" ? (
          <Services />
        ) : (
          <SettingsPage />
        )}
      </main>
    </div>
  );
}

export default Dashboard;