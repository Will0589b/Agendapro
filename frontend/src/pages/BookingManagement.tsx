import { useEffect, useState } from "react";

import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  RotateCcw,
  TriangleAlert,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import BrandLogo from "../components/BrandLogo";
import { supabase } from "../lib/supabase";
import "./BookingManagement.css";

type BookingManagementProps = {
  token: string;
};

type ManagedAppointment = {
  id: string;
  status: string;
  starts_at: string;
  ends_at: string;
  notes: string | null;
  client_name: string;
  service_id: string;
  service_name: string;
  duration_minutes: number;
  price: number;
  professional_name: string;
  business_name: string;
  timezone: string;
  booking_slug: string;
  can_cancel: boolean;
};

type CancellationResult = {
  ok: boolean;
  already_cancelled?: boolean;
  message: string;
};

type AvailableSlot = {
  starts_at: string;
  ends_at: string;
};

type RescheduleResult = {
  ok: boolean;
  message: string;
  starts_at?: string;
  ends_at?: string;
};

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(date.getDate()).padStart(
    2,
    "0",
  );

  return `${year}-${month}-${day}`;
};

function BookingManagement({
  token,
}: BookingManagementProps) {
  const [appointment, setAppointment] =
    useState<ManagedAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] =
    useState(false);
  const [confirmingCancellation, setConfirmingCancellation] =
    useState(false);
  const [rescheduling, setRescheduling] =
    useState(false);
  const [selectedDate, setSelectedDate] =
    useState("");
  const [slots, setSlots] = useState<
    AvailableSlot[]
  >([]);
  const [selectedSlot, setSelectedSlot] =
    useState<AvailableSlot | null>(null);
  const [loadingSlots, setLoadingSlots] =
    useState(false);
  const [submittingReschedule, setSubmittingReschedule] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAppointment = async () => {
      setLoading(true);
      setError(null);

      const { data, error: loadError } =
        await supabase.rpc(
          "get_public_appointment",
          {
            p_token: token,
          },
        );

      if (!isMounted) {
        return;
      }

      if (loadError) {
        console.error(loadError);
        setError(
          "Não foi possível carregar este agendamento.",
        );
      } else if (!data) {
        setError(
          "Este link de agendamento não existe ou não está mais disponível.",
        );
      } else {
        setAppointment(
          data as unknown as ManagedAppointment,
        );
      }

      setLoading(false);
    };

    void loadAppointment();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (
      !rescheduling ||
      !selectedDate ||
      !appointment
    ) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    let isMounted = true;

    const loadSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      setError(null);

      const { data, error: slotsError } =
        await supabase.rpc(
          "get_public_available_slots",
          {
            p_slug: appointment.booking_slug,
            p_service_id: appointment.service_id,
            p_date: selectedDate,
          },
        );

      if (!isMounted) {
        return;
      }

      if (slotsError) {
        console.error(slotsError);
        setError(
          "Não foi possível consultar os horários disponíveis.",
        );
        setSlots([]);
      } else {
        setSlots(
          (data ?? []) as unknown as AvailableSlot[],
        );
      }

      setLoadingSlots(false);
    };

    void loadSlots();

    return () => {
      isMounted = false;
    };
  }, [appointment, rescheduling, selectedDate]);

  const handleCancel = async () => {
    if (!appointment || cancelling) {
      return;
    }

    setCancelling(true);
    setError(null);
    setSuccessMessage(null);

    const { data, error: cancellationError } =
      await supabase.rpc(
        "cancel_public_appointment",
        {
          p_token: token,
        },
      );

    if (cancellationError) {
      console.error(cancellationError);
      setError(
        "Não foi possível cancelar o agendamento.",
      );
      setCancelling(false);
      return;
    }

    const result =
      data as unknown as CancellationResult;

    if (!result?.ok) {
      setError(
        result?.message ||
          "Este agendamento não pode ser cancelado.",
      );
      setConfirmingCancellation(false);
      setCancelling(false);
      return;
    }

    setAppointment((currentAppointment) =>
      currentAppointment
        ? {
            ...currentAppointment,
            status: "cancelled",
            can_cancel: false,
          }
        : currentAppointment,
    );
    setSuccessMessage(result.message);
    setConfirmingCancellation(false);
    setCancelling(false);
  };

  const handleReschedule = async () => {
    if (
      !appointment ||
      !selectedSlot ||
      submittingReschedule
    ) {
      return;
    }

    setSubmittingReschedule(true);
    setError(null);
    setSuccessMessage(null);

    const { data, error: rescheduleError } =
      await supabase.rpc(
        "reschedule_public_appointment",
        {
          p_token: token,
          p_starts_at: selectedSlot.starts_at,
        },
      );

    if (rescheduleError) {
      console.error(rescheduleError);
      setError(
        "Não foi possível reagendar o atendimento.",
      );
      setSubmittingReschedule(false);
      return;
    }

    const result =
      data as unknown as RescheduleResult;

    if (!result?.ok) {
      setError(
        result?.message ||
          "O horário escolhido não está mais disponível.",
      );
      setSubmittingReschedule(false);
      return;
    }

    setAppointment((currentAppointment) =>
      currentAppointment
        ? {
            ...currentAppointment,
            starts_at:
              result.starts_at ||
              selectedSlot.starts_at,
            ends_at:
              result.ends_at || selectedSlot.ends_at,
            status: "scheduled",
            can_cancel: true,
          }
        : currentAppointment,
    );
    setSuccessMessage(result.message);
    setSelectedDate("");
    setSelectedSlot(null);
    setSlots([]);
    setRescheduling(false);
    setSubmittingReschedule(false);
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone:
        appointment?.timezone ||
        "America/Sao_Paulo",
    }).format(new Date(value));

  const formatTime = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone:
        appointment?.timezone ||
        "America/Sao_Paulo",
    }).format(new Date(value));

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const minimumDate = toDateInputValue(
    new Date(),
  );
  const maximumDateValue = new Date();
  maximumDateValue.setDate(
    maximumDateValue.getDate() + 90,
  );
  const maximumDate = toDateInputValue(
    maximumDateValue,
  );

  if (loading) {
    return (
      <main className="booking-management-page">
        <div className="booking-management-centered">
          <LoaderCircle
            className="booking-management-spin"
            size={34}
          />
          <p>Carregando seu agendamento...</p>
        </div>
      </main>
    );
  }

  if (!appointment) {
    return (
      <main className="booking-management-page">
        <section className="booking-management-centered booking-management-error-state">
          <XCircle size={38} />
          <h1>Agendamento indisponível</h1>
          <p>{error}</p>
          <a href="/">
            <ArrowLeft size={17} />
            Voltar para o AgendaPro
          </a>
        </section>
      </main>
    );
  }

  const isCancelled =
    appointment.status === "cancelled";

  return (
    <main className="booking-management-page">
      <div className="booking-management-shape shape-blue" />
      <div className="booking-management-shape shape-green" />

      <header className="booking-management-topbar">
        <BrandLogo />
        <span>Área do cliente</span>
      </header>

      <section className="booking-management-card">
        <header className="booking-management-header">
          <div
            className={`booking-management-status ${appointment.status}`}
          >
            {isCancelled ? (
              <XCircle size={20} />
            ) : (
              <CheckCircle2 size={20} />
            )}
            {statusLabels[appointment.status] ||
              appointment.status}
          </div>

          <p>GERENCIAR AGENDAMENTO</p>
          <h1>{appointment.business_name}</h1>
          <span>
            Olá, {appointment.client_name}. Confira os
            detalhes do seu atendimento.
          </span>
        </header>

        {successMessage && (
          <div className="booking-management-message success">
            <CheckCircle2 size={19} />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="booking-management-message error">
            <TriangleAlert size={19} />
            {error}
          </div>
        )}

        <div className="booking-management-details">
          <article>
            <span className="booking-management-icon blue">
              <BriefcaseBusiness size={21} />
            </span>
            <div>
              <small>Serviço</small>
              <strong>{appointment.service_name}</strong>
            </div>
          </article>

          <article>
            <span className="booking-management-icon green">
              <CalendarDays size={21} />
            </span>
            <div>
              <small>Data</small>
              <strong className="capitalize">
                {formatDate(appointment.starts_at)}
              </strong>
            </div>
          </article>

          <article>
            <span className="booking-management-icon purple">
              <Clock3 size={21} />
            </span>
            <div>
              <small>Horário</small>
              <strong>
                {formatTime(appointment.starts_at)} –{" "}
                {formatTime(appointment.ends_at)}
              </strong>
            </div>
          </article>

          <article>
            <span className="booking-management-icon orange">
              <UserRound size={21} />
            </span>
            <div>
              <small>Profissional</small>
              <strong>
                {appointment.professional_name}
              </strong>
            </div>
          </article>
        </div>

        <div className="booking-management-summary">
          <span>Duração</span>
          <strong>
            {appointment.duration_minutes} min
          </strong>
          <span>Valor</span>
          <strong>
            {formatPrice(appointment.price)}
          </strong>
        </div>

        {appointment.notes && (
          <div className="booking-management-notes">
            <small>Observações</small>
            <p>{appointment.notes}</p>
          </div>
        )}

        {rescheduling && (
          <section className="booking-reschedule-panel">
            <header>
              <span>
                <CalendarClock size={21} />
              </span>
              <div>
                <h2>Escolha o novo horário</h2>
                <p>
                  Consulte a agenda e selecione outra opção.
                </p>
              </div>
            </header>

            <label>
              Nova data
              <input
                type="date"
                min={minimumDate}
                max={maximumDate}
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(event.target.value)
                }
              />
            </label>

            <div className="booking-reschedule-slots">
              {loadingSlots ? (
                <div className="booking-reschedule-feedback">
                  <LoaderCircle
                    className="booking-management-spin"
                    size={22}
                  />
                  Consultando horários...
                </div>
              ) : selectedDate && slots.length > 0 ? (
                slots.map((slot) => (
                  <button
                    key={slot.starts_at}
                    type="button"
                    className={
                      selectedSlot?.starts_at ===
                      slot.starts_at
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      setSelectedSlot(slot)
                    }
                  >
                    <Clock3 size={16} />
                    {formatTime(slot.starts_at)}
                  </button>
                ))
              ) : selectedDate ? (
                <div className="booking-reschedule-feedback">
                  Nenhum horário disponível nesta data.
                </div>
              ) : (
                <div className="booking-reschedule-feedback">
                  Escolha uma data para visualizar os horários.
                </div>
              )}
            </div>

            <footer>
              <button
                type="button"
                className="booking-management-secondary"
                onClick={() => {
                  setRescheduling(false);
                  setSelectedDate("");
                  setSelectedSlot(null);
                  setSlots([]);
                }}
                disabled={submittingReschedule}
              >
                Voltar
              </button>
              <button
                type="button"
                className="booking-management-primary"
                onClick={() => void handleReschedule()}
                disabled={
                  !selectedSlot || submittingReschedule
                }
              >
                {submittingReschedule ? (
                  <LoaderCircle
                    className="booking-management-spin"
                    size={18}
                  />
                ) : (
                  <CalendarClock size={18} />
                )}
                Confirmar novo horário
              </button>
            </footer>
          </section>
        )}

        <footer className="booking-management-actions">
          {appointment.can_cancel && !isCancelled ? (
            <button
              type="button"
              className="booking-management-primary"
              onClick={() => {
                setRescheduling((current) => !current);
                setSuccessMessage(null);
                setError(null);
              }}
            >
              <CalendarClock size={18} />
              Reagendar
            </button>
          ) : (
            <a
              className="booking-management-secondary"
              href={`/agendar/${encodeURIComponent(
                appointment.booking_slug,
              )}`}
            >
              <RotateCcw size={18} />
              Agendar outro horário
            </a>
          )}

          {appointment.can_cancel && !isCancelled && (
            <button
              type="button"
              className="booking-management-danger"
              onClick={() =>
                setConfirmingCancellation(true)
              }
            >
              <XCircle size={18} />
              Cancelar agendamento
            </button>
          )}
        </footer>

        {isCancelled && (
          <p className="booking-management-cancelled-note">
            Este horário foi liberado novamente na agenda.
          </p>
        )}
      </section>

      {confirmingCancellation && (
        <div
          className="booking-management-modal-overlay"
          role="presentation"
        >
          <section
            className="booking-management-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-booking-title"
          >
            <button
              type="button"
              className="booking-management-modal-close"
              onClick={() =>
                setConfirmingCancellation(false)
              }
              disabled={cancelling}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>

            <span className="booking-management-modal-icon">
              <TriangleAlert size={25} />
            </span>
            <h2 id="cancel-booking-title">
              Cancelar este agendamento?
            </h2>
            <p>
              O horário será liberado para outros clientes.
              Essa ação não poderá ser desfeita por este link.
            </p>

            <div>
              <button
                type="button"
                className="booking-management-secondary"
                onClick={() =>
                  setConfirmingCancellation(false)
                }
                disabled={cancelling}
              >
                Manter agendamento
              </button>
              <button
                type="button"
                className="booking-management-danger"
                onClick={() => void handleCancel()}
                disabled={cancelling}
              >
                {cancelling ? (
                  <LoaderCircle
                    className="booking-management-spin"
                    size={18}
                  />
                ) : (
                  <XCircle size={18} />
                )}
                Confirmar cancelamento
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default BookingManagement;
