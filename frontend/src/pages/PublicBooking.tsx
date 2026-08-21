import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FormEvent } from "react";

import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  UserRound,
  XCircle,
} from "lucide-react";

import BrandLogo from "../components/BrandLogo";
import { supabase } from "../lib/supabase";
import "./PublicBooking.css";

type PublicBookingProps = {
  slug: string;
};

type PublicService = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
};

type BusinessHour = {
  day_of_week: number;
  is_open: boolean;
  start_time: string | null;
  end_time: string | null;
};

type BookingPageData = {
  professional_name: string;
  business_name: string;
  phone: string | null;
  address: string | null;
  bio: string | null;
  timezone: string;
  services: PublicService[];
  business_hours: BusinessHour[];
};

type AvailableSlot = {
  starts_at: string;
  ends_at: string;
};

type ClientForm = {
  name: string;
  phone: string;
  email: string;
  notes: string;
};

type BookingConfirmation = {
  startsAt: string;
  endsAt: string;
  serviceName: string;
};

const initialClientForm: ClientForm = {
  name: "",
  phone: "",
  email: "",
  notes: "",
};

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(date.getDate()).padStart(
    2,
    "0"
  );

  return `${year}-${month}-${day}`;
};

function PublicBooking({
  slug,
}: PublicBookingProps) {
  const [pageData, setPageData] =
    useState<BookingPageData | null>(null);

  const [selectedServiceId, setSelectedServiceId] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState("");

  const [slots, setSlots] = useState<
    AvailableSlot[]
  >([]);

  const [selectedSlot, setSelectedSlot] =
    useState<AvailableSlot | null>(null);

  const [clientForm, setClientForm] =
    useState<ClientForm>(initialClientForm);

  const [loadingPage, setLoadingPage] =
    useState(true);

  const [loadingSlots, setLoadingSlots] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [confirmation, setConfirmation] =
    useState<BookingConfirmation | null>(null);

  const minimumDate = useMemo(
    () => toDateInputValue(new Date()),
    []
  );

  const maximumDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 90);
    return toDateInputValue(date);
  }, []);

  const selectedService = useMemo(
    () =>
      pageData?.services.find(
        (service) =>
          service.id === selectedServiceId
      ) ?? null,
    [pageData, selectedServiceId]
  );

  useEffect(() => {
    let isMounted = true;

    const loadPublicPage = async () => {
      setLoadingPage(true);
      setError(null);

      const { data, error: pageError } =
        await supabase.rpc(
          "get_public_booking_page",
          {
            p_slug: slug,
          }
        );

      if (!isMounted) {
        return;
      }

      if (pageError) {
        console.error(pageError);
        setError(
          "Não foi possível carregar esta página de agendamento."
        );
        setLoadingPage(false);
        return;
      }

      if (!data) {
        setError(
          "Esta página de agendamento não existe ou está desativada."
        );
        setLoadingPage(false);
        return;
      }

      const bookingData =
        data as unknown as BookingPageData;

      setPageData({
        ...bookingData,
        services: bookingData.services ?? [],
        business_hours:
          bookingData.business_hours ?? [],
      });

      setLoadingPage(false);
    };

    void loadPublicPage();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!selectedServiceId || !selectedDate) {
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
            p_slug: slug,
            p_service_id:
              selectedServiceId,
            p_date: selectedDate,
          }
        );

      if (!isMounted) {
        return;
      }

      if (slotsError) {
        console.error(slotsError);
        setSlots([]);
        setError(
          "Não foi possível consultar os horários disponíveis."
        );
      } else {
        setSlots(
          (data ?? []) as unknown as AvailableSlot[]
        );
      }

      setLoadingSlots(false);
    };

    void loadSlots();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedServiceId, slug]);

  const updateClientField = (
    field: keyof ClientForm,
    value: string
  ) => {
    setClientForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);

  const formatTime = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone:
        pageData?.timezone ??
        "America/Sao_Paulo",
    }).format(new Date(value));

  const formatLongDate = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone:
        pageData?.timezone ??
        "America/Sao_Paulo",
    }).format(new Date(value));

  const reloadSlots = async () => {
    if (!selectedServiceId || !selectedDate) {
      return;
    }

    const { data } = await supabase.rpc(
      "get_public_available_slots",
      {
        p_slug: slug,
        p_service_id: selectedServiceId,
        p_date: selectedDate,
      }
    );

    setSlots(
      (data ?? []) as unknown as AvailableSlot[]
    );
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!selectedService || !selectedSlot) {
      setError(
        "Escolha um serviço, uma data e um horário."
      );
      return;
    }

    if (clientForm.name.trim().length < 2) {
      setError("Informe seu nome completo.");
      return;
    }

    const phoneDigits =
      clientForm.phone.replace(/\D/g, "");

    if (phoneDigits.length < 8) {
      setError("Informe um telefone válido.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: appointmentError } =
      await supabase.rpc(
        "create_public_appointment",
        {
          p_slug: slug,
          p_service_id: selectedService.id,
          p_starts_at:
            selectedSlot.starts_at,
          p_client_name:
            clientForm.name.trim(),
          p_phone: clientForm.phone.trim(),
          p_email:
            clientForm.email.trim() || null,
          p_notes:
            clientForm.notes.trim() || null,
        }
      );

    if (appointmentError) {
      console.error(appointmentError);

      const message =
        appointmentError.message.includes(
          "não está mais disponível"
        ) ||
        appointmentError.message.includes(
          "acabou de ser reservado"
        )
          ? appointmentError.message
          : "Não foi possível concluir o agendamento.";

      setError(message);
      setSelectedSlot(null);
      await reloadSlots();
      setSubmitting(false);
      return;
    }

    setConfirmation({
      startsAt: selectedSlot.starts_at,
      endsAt: selectedSlot.ends_at,
      serviceName: selectedService.name,
    });

    setSubmitting(false);
  };

  const resetBooking = () => {
    setSelectedServiceId("");
    setSelectedDate("");
    setSelectedSlot(null);
    setSlots([]);
    setClientForm(initialClientForm);
    setConfirmation(null);
    setError(null);
  };

  if (loadingPage) {
    return (
      <main className="public-booking-page">
        <div className="public-booking-loading">
          <LoaderCircle
            className="public-booking-spin"
            size={32}
          />
          <span>
            Carregando página de agendamento...
          </span>
        </div>
      </main>
    );
  }

  if (!pageData) {
    return (
      <main className="public-booking-page">
        <div className="public-booking-unavailable">
          <XCircle size={42} />
          <h1>Página indisponível</h1>
          <p>{error}</p>
          <a href="/">
            <ArrowLeft size={17} />
            Voltar para o AgendaPro
          </a>
        </div>
      </main>
    );
  }

  if (confirmation) {
    return (
      <main className="public-booking-page">
        <div className="public-booking-success">
          <div className="public-success-icon">
            <CheckCircle2 size={40} />
          </div>

          <span>Agendamento confirmado</span>
          <h1>Seu horário foi reservado!</h1>
          <p>
            Confira os dados do seu compromisso.
          </p>

          <div className="public-success-summary">
            <div>
              <BriefcaseBusiness size={18} />
              <span>
                <small>Serviço</small>
                <strong>
                  {confirmation.serviceName}
                </strong>
              </span>
            </div>

            <div>
              <CalendarDays size={18} />
              <span>
                <small>Data</small>
                <strong>
                  {formatLongDate(
                    confirmation.startsAt
                  )}
                </strong>
              </span>
            </div>

            <div>
              <Clock3 size={18} />
              <span>
                <small>Horário</small>
                <strong>
                  {formatTime(
                    confirmation.startsAt
                  )}
                  {" - "}
                  {formatTime(
                    confirmation.endsAt
                  )}
                </strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={resetBooking}
          >
            Fazer outro agendamento
          </button>

          <small>
            Agendado com {pageData.business_name}
          </small>
        </div>
      </main>
    );
  }

  return (
    <main className="public-booking-page">
      <div className="public-booking-shape public-shape-blue" />
      <div className="public-booking-shape public-shape-green" />

      <header className="public-booking-topbar">
        <BrandLogo />
        <a href="/">Área do profissional</a>
      </header>

      <div className="public-booking-layout">
        <aside className="public-professional-card">
          <div className="public-professional-avatar">
            {pageData.professional_name
              .charAt(0)
              .toUpperCase() || "A"}
          </div>

          <span>Agende seu horário com</span>
          <h1>{pageData.professional_name}</h1>
          <strong>{pageData.business_name}</strong>

          {pageData.bio && (
            <p>{pageData.bio}</p>
          )}

          <div className="public-professional-details">
            {pageData.address && (
              <div>
                <MapPin size={17} />
                <span>{pageData.address}</span>
              </div>
            )}

            {pageData.phone && (
              <div>
                <Phone size={17} />
                <span>{pageData.phone}</span>
              </div>
            )}
          </div>
        </aside>

        <section className="public-booking-card">
          <header className="public-booking-heading">
            <span>Agendamento online</span>
            <h2>Escolha seu atendimento</h2>
            <p>
              Selecione o serviço, a data e o melhor
              horário para você.
            </p>
          </header>

          {error && (
            <div
              className="public-booking-error"
              role="alert"
            >
              <XCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="public-booking-section">
            <div className="public-section-title">
              <span aria-hidden="true">
                <BriefcaseBusiness size={18} />
              </span>
              <div>
                <h3>Escolha o serviço</h3>
                <p>
                  Selecione o atendimento desejado.
                </p>
              </div>
            </div>

            {pageData.services.length > 0 ? (
              <div className="public-services-grid">
                {pageData.services.map(
                  (service) => (
                    <button
                      key={service.id}
                      type="button"
                      className={`public-service-option ${
                        selectedServiceId ===
                        service.id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedServiceId(
                          service.id
                        );
                        setSelectedDate("");
                        setSelectedSlot(null);
                        setError(null);
                      }}
                    >
                      <span className="public-service-icon">
                        <BriefcaseBusiness
                          size={20}
                        />
                      </span>

                      <span className="public-service-data">
                        <strong>
                          {service.name}
                        </strong>
                        {service.description && (
                          <small>
                            {service.description}
                          </small>
                        )}
                        <span>
                          <Clock3 size={14} />
                          {
                            service.duration_minutes
                          }{" "}
                          min
                        </span>
                      </span>

                      <strong className="public-service-price">
                        {formatPrice(
                          service.price
                        )}
                      </strong>
                    </button>
                  )
                )}
              </div>
            ) : (
              <p className="public-booking-notice">
                Nenhum serviço está disponível no
                momento.
              </p>
            )}
          </div>

          <div className="public-booking-section">
            <div className="public-section-title">
              <span aria-hidden="true">
                <CalendarDays size={18} />
              </span>
              <div>
                <h3>Escolha a data</h3>
                <p>
                  Consulte os horários disponíveis.
                </p>
              </div>
            </div>

            <input
              className="public-date-input"
              type="date"
              value={selectedDate}
              min={minimumDate}
              max={maximumDate}
              disabled={!selectedServiceId}
              onChange={(event) => {
                setSelectedDate(
                  event.target.value
                );
                setSelectedSlot(null);
              }}
            />

            {loadingSlots ? (
              <div className="public-slots-loading">
                <LoaderCircle
                  className="public-booking-spin"
                  size={21}
                />
                Buscando horários...
              </div>
            ) : selectedDate &&
              selectedServiceId ? (
              slots.length > 0 ? (
                <div className="public-slots-grid">
                  {slots.map((slot) => (
                    <button
                      key={slot.starts_at}
                      type="button"
                      className={
                        selectedSlot?.starts_at ===
                        slot.starts_at
                          ? "selected"
                          : ""
                      }
                      onClick={() => {
                        setSelectedSlot(slot);
                        setError(null);
                      }}
                    >
                      <Clock3 size={15} />
                      {formatTime(slot.starts_at)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="public-booking-notice">
                  Não há horários disponíveis nesta
                  data. Escolha outro dia.
                </p>
              )
            ) : (
              <p className="public-booking-helper">
                Escolha primeiro um serviço e depois
                selecione a data.
              </p>
            )}
          </div>

          <form
            className="public-booking-section public-client-form"
            onSubmit={handleSubmit}
          >
            <div className="public-section-title">
              <span aria-hidden="true">
                <UserRound size={18} />
              </span>
              <div>
                <h3>Seus dados</h3>
                <p>
                  Informe como o profissional poderá
                  entrar em contato.
                </p>
              </div>
            </div>

            <div className="public-client-grid">
              <label>
                <span>
                  <UserRound size={15} />
                  Nome completo
                </span>
                <input
                  type="text"
                  value={clientForm.name}
                  required
                  maxLength={100}
                  placeholder="Seu nome"
                  onChange={(event) =>
                    updateClientField(
                      "name",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                <span>
                  <Phone size={15} />
                  Telefone
                </span>
                <input
                  type="tel"
                  value={clientForm.phone}
                  required
                  maxLength={20}
                  placeholder="(61) 99999-9999"
                  onChange={(event) =>
                    updateClientField(
                      "phone",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                <span>
                  <Mail size={15} />
                  E-mail opcional
                </span>
                <input
                  type="email"
                  value={clientForm.email}
                  maxLength={150}
                  placeholder="seuemail@exemplo.com"
                  onChange={(event) =>
                    updateClientField(
                      "email",
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="public-client-notes">
                <span>Observações</span>
                <textarea
                  value={clientForm.notes}
                  rows={3}
                  maxLength={500}
                  placeholder="Alguma informação importante?"
                  onChange={(event) =>
                    updateClientField(
                      "notes",
                      event.target.value
                    )
                  }
                />
              </label>
            </div>

            {selectedService && selectedSlot && (
              <div className="public-booking-summary">
                <div>
                  <strong>
                    {selectedService.name}
                  </strong>
                  <span>
                    {formatLongDate(
                      selectedSlot.starts_at
                    )}
                  </span>
                </div>
                <strong>
                  {formatTime(
                    selectedSlot.starts_at
                  )}
                </strong>
              </div>
            )}

            <button
              type="submit"
              className="public-booking-submit"
              disabled={
                submitting ||
                !selectedService ||
                !selectedSlot
              }
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    className="public-booking-spin"
                    size={19}
                  />
                  Confirmando...
                </>
              ) : (
                <>
                  <CalendarDays size={19} />
                  Confirmar agendamento
                </>
              )}
            </button>
          </form>
        </section>
      </div>

      <footer className="public-booking-footer">
        Agendamento seguro com AgendaPro
      </footer>
    </main>
  );
}

export default PublicBooking;