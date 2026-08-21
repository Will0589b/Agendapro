import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FormEvent } from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Pencil,
  Plus,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import "./Appointments.css";

type ClientOption = {
  id: string;
  name: string;
};

type ServiceOption = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
};

type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

type Appointment = {
  id: string;
  client_id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  notes: string | null;

  client: {
    name: string;
    phone: string | null;
  } | null;

  service: {
    name: string;
    duration_minutes: number;
    price: number;
  } | null;
};

type AppointmentForm = {
  clientId: string;
  serviceId: string;
  date: string;
  time: string;
  notes: string;
};

const initialForm: AppointmentForm = {
  clientId: "",
  serviceId: "",
  date: "",
  time: "",
  notes: "",
};

function Appointments() {
  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [clients, setClients] = useState<
    ClientOption[]
  >([]);

  const [services, setServices] = useState<
    ServiceOption[]
  >([]);

  const [form, setForm] =
    useState<AppointmentForm>(initialForm);

  const [showForm, setShowForm] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [
    editingAppointmentId,
    setEditingAppointmentId,
  ] = useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const loadAppointments =
    useCallback(async () => {
      const { data, error: loadError } =
        await supabase
          .from("appointments")
          .select(`
            id,
            client_id,
            service_id,
            starts_at,
            ends_at,
            status,
            notes,
            client:clients!appointments_client_owner_fkey (
              name,
              phone
            ),
            service:services!appointments_service_owner_fkey (
              name,
              duration_minutes,
              price
            )
          `)
          .gte(
            "ends_at",
            new Date().toISOString()
          )
          .order("starts_at", {
            ascending: true,
          });

      if (loadError) {
        setError(
          "Não foi possível carregar os agendamentos."
        );

        console.error(loadError);
        return;
      }

      const normalizedAppointments: Appointment[] =
        (data ?? []).map((item) => {
          const appointment =
            item as unknown as Omit<
              Appointment,
              "client" | "service"
            > & {
              client:
                | Appointment["client"]
                | Appointment["client"][];

              service:
                | Appointment["service"]
                | Appointment["service"][];
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
        });

      setAppointments(
        normalizedAppointments
      );
    }, []);

  useEffect(() => {
    const loadPageData = async () => {
      setLoading(true);
      setError(null);

      const [
        clientsResponse,
        servicesResponse,
      ] = await Promise.all([
        supabase
          .from("clients")
          .select("id, name")
          .order("name", {
            ascending: true,
          }),

        supabase
          .from("services")
          .select(
            "id, name, duration_minutes, price"
          )
          .eq("active", true)
          .order("name", {
            ascending: true,
          }),
      ]);

      if (clientsResponse.error) {
        console.error(
          clientsResponse.error
        );

        setError(
          "Não foi possível carregar os clientes."
        );
      } else {
        setClients(
          (clientsResponse.data ??
            []) as ClientOption[]
        );
      }

      if (servicesResponse.error) {
        console.error(
          servicesResponse.error
        );

        setError(
          "Não foi possível carregar os serviços."
        );
      } else {
        setServices(
          (servicesResponse.data ??
            []) as ServiceOption[]
        );
      }

      await loadAppointments();
      setLoading(false);
    };

    loadPageData();
  }, [loadAppointments]);

  const selectedService = useMemo(
    () =>
      services.find(
        (service) =>
          service.id === form.serviceId
      ),
    [services, form.serviceId]
  );

  const calculatedPeriod = useMemo(() => {
    if (
      !form.date ||
      !form.time ||
      !selectedService
    ) {
      return null;
    }

    const startsAt = new Date(
      `${form.date}T${form.time}:00`
    );

    if (
      Number.isNaN(startsAt.getTime())
    ) {
      return null;
    }

    const endsAt = new Date(
      startsAt.getTime() +
        selectedService.duration_minutes *
          60 *
          1000
    );

    return {
      startsAt,
      endsAt,
    };
  }, [
    form.date,
    form.time,
    selectedService,
  ]);

  const updateFormField = (
    field: keyof AppointmentForm,
    value: string
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const openCreateForm = () => {
    setEditingAppointmentId(null);
    setForm(initialForm);
    setError(null);
    setShowForm(true);
  };

  const openEditForm = (
    appointment: Appointment
  ) => {
    const startsAt = new Date(
      appointment.starts_at
    );

    const year = startsAt.getFullYear();
    const month = String(
      startsAt.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
      startsAt.getDate()
    ).padStart(2, "0");
    const hours = String(
      startsAt.getHours()
    ).padStart(2, "0");
    const minutes = String(
      startsAt.getMinutes()
    ).padStart(2, "0");

    setEditingAppointmentId(
      appointment.id
    );

    setForm({
      clientId: appointment.client_id,
      serviceId: appointment.service_id,
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`,
      notes: appointment.notes ?? "",
    });

    setError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingAppointmentId(null);
    setForm(initialForm);
    setError(null);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !form.clientId ||
      !form.serviceId ||
      !calculatedPeriod
    ) {
      setError(
        "Preencha cliente, serviço, data e horário."
      );

      return;
    }

    if (
      calculatedPeriod.startsAt <= new Date()
    ) {
      setError(
        "Escolha uma data e um horário futuros."
      );

      return;
    }

    setSaving(true);
    setError(null);

    const appointmentData = {
      client_id: form.clientId,
      service_id: form.serviceId,
      starts_at:
        calculatedPeriod.startsAt.toISOString(),
      ends_at:
        calculatedPeriod.endsAt.toISOString(),
      notes: form.notes.trim() || null,
    };

    if (editingAppointmentId) {
      const { error: updateError } =
        await supabase
          .from("appointments")
          .update(appointmentData)
          .eq("id", editingAppointmentId);

      if (updateError) {
        console.error(updateError);

        if (updateError.code === "23P01") {
          setError(
            "Esse horário já possui outro agendamento."
          );
        } else {
          setError(
            "Não foi possível editar o agendamento."
          );
        }

        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } =
        await supabase
          .from("appointments")
          .insert({
            ...appointmentData,
            status: "scheduled",
          });

      if (insertError) {
        console.error(insertError);

        if (insertError.code === "23P01") {
          setError(
            "Esse horário já possui um agendamento. Escolha outro horário."
          );
        } else {
          setError(
            "Não foi possível criar o agendamento."
          );
        }

        setSaving(false);
        return;
      }
    }

    await loadAppointments();

    setSaving(false);
    setShowForm(false);
    setEditingAppointmentId(null);
    setForm(initialForm);
  };

  const handleStatusChange = async (
    appointment: Appointment,
    newStatus: AppointmentStatus
  ) => {
    setUpdatingId(appointment.id);
    setError(null);

    const { error: updateError } =
      await supabase
        .from("appointments")
        .update({
          status: newStatus,
        })
        .eq("id", appointment.id);

    if (updateError) {
      console.error(updateError);

      setError(
        "Não foi possível atualizar o agendamento."
      );

      setUpdatingId(null);
      return;
    }

    setAppointments(
      (currentAppointments) =>
        currentAppointments.map(
          (currentAppointment) =>
            currentAppointment.id ===
            appointment.id
              ? {
                  ...currentAppointment,
                  status: newStatus,
                }
              : currentAppointment
        )
    );

    setUpdatingId(null);
  };

  const handleCancel = async (
    appointment: Appointment
  ) => {
    const confirmed = window.confirm(
      `Deseja cancelar o agendamento de ${
        appointment.client?.name ??
        "este cliente"
      }?`
    );

    if (!confirmed) {
      return;
    }

    await handleStatusChange(
      appointment,
      "cancelled"
    );
  };

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }).format(new Date(date));

  const formatTime = (date: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);

  const statusLabels: Record<
    AppointmentStatus,
    string
  > = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    completed: "Concluído",
    cancelled: "Cancelado",
    no_show: "Não compareceu",
  };

  return (
    <section className="appointments-page">
      <header className="appointments-header">
        <div>
          <span className="appointments-eyebrow">
            Agenda
          </span>

          <h2>Agendamentos</h2>

          <p>
            Organize os próximos horários dos
            seus clientes.
          </p>
        </div>

        <button
          type="button"
          className="appointments-primary-button"
          onClick={openCreateForm}
        >
          <Plus size={19} />
          Novo agendamento
        </button>
      </header>

      {error && (
        <div
          className="appointments-error"
          role="alert"
        >
          <XCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="appointments-loading">
          <LoaderCircle
            className="appointments-spin"
            size={28}
          />

          <span>
            Carregando agendamentos...
          </span>
        </div>
      ) : appointments.length === 0 ? (
        <div className="appointments-empty">
          <div className="appointments-empty-icon">
            <CalendarDays size={34} />
          </div>

          <h3>Nenhum agendamento</h3>

          <p>
            Crie o primeiro agendamento para
            começar a organizar sua agenda.
          </p>

          <button
            type="button"
            className="appointments-primary-button"
            onClick={openCreateForm}
          >
            <Plus size={19} />
            Criar agendamento
          </button>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map(
            (appointment) => (
              <article
                key={appointment.id}
                className="appointment-card"
              >
                <div className="appointment-date-box">
                  <CalendarDays size={20} />

                  <strong>
                    {formatDate(
                      appointment.starts_at
                    )}
                  </strong>

                  <span>
                    {formatTime(
                      appointment.starts_at
                    )}
                  </span>
                </div>

                <div className="appointment-information">
                  <div className="appointment-title-row">
                    <div>
                      <h3>
                        {appointment.client
                          ?.name ??
                          "Cliente removido"}
                      </h3>

                      <p>
                        {appointment.service
                          ?.name ??
                          "Serviço removido"}
                      </p>
                    </div>

                    <span
                      className={`appointment-status ${appointment.status}`}
                    >
                      {
                        statusLabels[
                          appointment.status
                        ]
                      }
                    </span>
                  </div>

                  <div className="appointment-details">
                    <span>
                      <Clock3 size={16} />

                      {formatTime(
                        appointment.starts_at
                      )}

                      {" - "}

                      {formatTime(
                        appointment.ends_at
                      )}
                    </span>

                    {appointment.service && (
                      <span>
                        {formatPrice(
                          appointment.service
                            .price
                        )}
                      </span>
                    )}

                    {appointment.client
                      ?.phone && (
                      <span>
                        <UserRound
                          size={16}
                        />

                        {
                          appointment.client
                            .phone
                        }
                      </span>
                    )}
                  </div>

                  {appointment.notes && (
                    <p className="appointment-notes">
                      {appointment.notes}
                    </p>
                  )}

                  <div className="appointment-actions">
                    {updatingId ===
                    appointment.id ? (
                      <span className="appointment-updating">
                        <LoaderCircle
                          className="appointments-spin"
                          size={17}
                        />

                        Atualizando...
                      </span>
                    ) : (
                      <>
                        {(appointment.status ===
                          "scheduled" ||
                          appointment.status ===
                            "confirmed") && (
                          <button
                            type="button"
                            className="appointment-action edit"
                            onClick={() =>
                              openEditForm(
                                appointment
                              )
                            }
                          >
                            <Pencil size={16} />
                            Editar
                          </button>
                        )}

                        {appointment.status ===
                          "scheduled" && (
                          <button
                            type="button"
                            className="appointment-action confirm"
                            onClick={() =>
                              handleStatusChange(
                                appointment,
                                "confirmed"
                              )
                            }
                          >
                            <CheckCircle2
                              size={16}
                            />
                            Confirmar
                          </button>
                        )}

                        {appointment.status ===
                          "confirmed" && (
                          <>
                            <button
                              type="button"
                              className="appointment-action complete"
                              onClick={() =>
                                handleStatusChange(
                                  appointment,
                                  "completed"
                                )
                              }
                            >
                              <CheckCircle2
                                size={16}
                              />
                              Concluir
                            </button>

                            <button
                              type="button"
                              className="appointment-action no-show"
                              onClick={() =>
                                handleStatusChange(
                                  appointment,
                                  "no_show"
                                )
                              }
                            >
                              <UserRound
                                size={16}
                              />
                              Não compareceu
                            </button>
                          </>
                        )}

                        {(appointment.status ===
                          "scheduled" ||
                          appointment.status ===
                            "confirmed") && (
                          <button
                            type="button"
                            className="appointment-action cancel"
                            onClick={() =>
                              handleCancel(
                                appointment
                              )
                            }
                          >
                            <XCircle
                              size={16}
                            />
                            Cancelar
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}

      {showForm && (
        <div
          className="appointment-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <div
            className="appointment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-modal-title"
          >
            <header className="appointment-modal-header">
              <div>
                <span className="appointments-eyebrow">
                  {editingAppointmentId
                    ? "Alterar compromisso"
                    : "Novo compromisso"}
                </span>

                <h3 id="appointment-modal-title">
                  {editingAppointmentId
                    ? "Editar agendamento"
                    : "Criar agendamento"}
                </h3>
              </div>

              <button
                type="button"
                className="appointment-modal-close"
                onClick={closeForm}
                aria-label="Fechar formulário"
              >
                <X size={21} />
              </button>
            </header>

            <form
              className="appointment-form"
              onSubmit={handleSubmit}
            >
              <label>
                Cliente
                <select
                  value={form.clientId}
                  required
                  onChange={(event) =>
                    updateFormField(
                      "clientId",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Selecione um cliente
                  </option>

                  {clients.map((client) => (
                    <option
                      key={client.id}
                      value={client.id}
                    >
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Serviço
                <select
                  value={form.serviceId}
                  required
                  onChange={(event) =>
                    updateFormField(
                      "serviceId",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Selecione um serviço
                  </option>

                  {services.map((service) => (
                    <option
                      key={service.id}
                      value={service.id}
                    >
                      {service.name} —{" "}
                      {
                        service.duration_minutes
                      }{" "}
                      min —{" "}
                      {formatPrice(
                        service.price
                      )}
                    </option>
                  ))}
                </select>
              </label>

              <div className="appointment-form-grid">
                <label>
                  Data
                  <input
                    type="date"
                    value={form.date}
                    required
                    min={new Date()
                      .toISOString()
                      .split("T")[0]}
                    onChange={(event) =>
                      updateFormField(
                        "date",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Horário
                  <input
                    type="time"
                    value={form.time}
                    required
                    onChange={(event) =>
                      updateFormField(
                        "time",
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>

              {calculatedPeriod && (
                <div className="appointment-period-preview">
                  <Clock3 size={18} />

                  <span>
                    Horário previsto:{" "}
                    <strong>
                      {formatTime(
                        calculatedPeriod.startsAt.toISOString()
                      )}

                      {" até "}

                      {formatTime(
                        calculatedPeriod.endsAt.toISOString()
                      )}
                    </strong>
                  </span>
                </div>
              )}

              <label>
                Observações
                <textarea
                  value={form.notes}
                  rows={3}
                  placeholder="Informações adicionais"
                  onChange={(event) =>
                    updateFormField(
                      "notes",
                      event.target.value
                    )
                  }
                />
              </label>

              <div className="appointment-form-actions">
                <button
                  type="button"
                  className="appointment-cancel-form-button"
                  disabled={saving}
                  onClick={closeForm}
                >
                  Voltar
                </button>

                <button
                  type="submit"
                  className="appointments-primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        className="appointments-spin"
                        size={18}
                      />
                      {editingAppointmentId
                        ? "Salvando..."
                        : "Agendando..."}
                    </>
                  ) : (
                    <>
                      {editingAppointmentId ? (
                        <Pencil size={18} />
                      ) : (
                        <CalendarDays
                          size={18}
                        />
                      )}

                      {editingAppointmentId
                        ? "Salvar alterações"
                        : "Confirmar agendamento"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Appointments;