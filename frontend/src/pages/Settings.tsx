import {
  useEffect,
  useState,
} from "react";
import type { FormEvent } from "react";

import {
  Building2,
  CheckCircle2,
  Clock3,
  Globe2,
  LoaderCircle,
  MapPin,
  Phone,
  Save,
  UserRound,
  XCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import "./Settings.css";

type ProfileForm = {
  professionalName: string;
  businessName: string;
  phone: string;
  address: string;
  bio: string;
  bookingSlug: string;
  bookingEnabled: boolean;
};

type BusinessHour = {
  dayOfWeek: number;
  label: string;
  isOpen: boolean;
  startTime: string;
  endTime: string;
};

type ProfileRow = {
  professional_name: string;
  business_name: string;
  phone: string | null;
  address: string | null;
  bio: string | null;
  booking_slug: string | null;
  booking_enabled: boolean;
};

type BusinessHourRow = {
  day_of_week: number;
  is_open: boolean;
  start_time: string | null;
  end_time: string | null;
};

const initialProfile: ProfileForm = {
  professionalName: "",
  businessName: "",
  phone: "",
  address: "",
  bio: "",
  bookingSlug: "",
  bookingEnabled: false,
};

const defaultHours: BusinessHour[] = [
  {
    dayOfWeek: 0,
    label: "Domingo",
    isOpen: false,
    startTime: "09:00",
    endTime: "18:00",
  },
  {
    dayOfWeek: 1,
    label: "Segunda-feira",
    isOpen: true,
    startTime: "09:00",
    endTime: "18:00",
  },
  {
    dayOfWeek: 2,
    label: "Terça-feira",
    isOpen: true,
    startTime: "09:00",
    endTime: "18:00",
  },
  {
    dayOfWeek: 3,
    label: "Quarta-feira",
    isOpen: true,
    startTime: "09:00",
    endTime: "18:00",
  },
  {
    dayOfWeek: 4,
    label: "Quinta-feira",
    isOpen: true,
    startTime: "09:00",
    endTime: "18:00",
  },
  {
    dayOfWeek: 5,
    label: "Sexta-feira",
    isOpen: true,
    startTime: "09:00",
    endTime: "18:00",
  },
  {
    dayOfWeek: 6,
    label: "Sábado",
    isOpen: false,
    startTime: "09:00",
    endTime: "13:00",
  },
];

const normalizeSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeTime = (
  value: string | null,
  fallback: string
) => (value ? value.slice(0, 5) : fallback);

function SettingsPage() {
  const [profile, setProfile] =
    useState<ProfileForm>(initialProfile);

  const [businessHours, setBusinessHours] =
    useState<BusinessHour[]>(defaultHours);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      setLoading(true);
      setError(null);

      const [profileResponse, hoursResponse] =
        await Promise.all([
          supabase
            .from("professional_profiles")
            .select(`
              professional_name,
              business_name,
              phone,
              address,
              bio,
              booking_slug,
              booking_enabled
            `)
            .maybeSingle(),

          supabase
            .from("business_hours")
            .select(`
              day_of_week,
              is_open,
              start_time,
              end_time
            `)
            .order("day_of_week", {
              ascending: true,
            }),
        ]);

      if (!isMounted) {
        return;
      }

      if (profileResponse.error) {
        console.error(profileResponse.error);
        setError(
          "Não foi possível carregar o perfil profissional."
        );
      } else if (profileResponse.data) {
        const data =
          profileResponse.data as ProfileRow;

        setProfile({
          professionalName:
            data.professional_name,
          businessName: data.business_name,
          phone: data.phone ?? "",
          address: data.address ?? "",
          bio: data.bio ?? "",
          bookingSlug:
            data.booking_slug ?? "",
          bookingEnabled:
            data.booking_enabled,
        });
      }

      if (hoursResponse.error) {
        console.error(hoursResponse.error);
        setError(
          "Não foi possível carregar os horários de atendimento."
        );
      } else if (
        hoursResponse.data &&
        hoursResponse.data.length > 0
      ) {
        const savedHours =
          hoursResponse.data as BusinessHourRow[];

        setBusinessHours(
          defaultHours.map((defaultHour) => {
            const savedHour = savedHours.find(
              (hour) =>
                hour.day_of_week ===
                defaultHour.dayOfWeek
            );

            if (!savedHour) {
              return defaultHour;
            }

            return {
              ...defaultHour,
              isOpen: savedHour.is_open,
              startTime: normalizeTime(
                savedHour.start_time,
                defaultHour.startTime
              ),
              endTime: normalizeTime(
                savedHour.end_time,
                defaultHour.endTime
              ),
            };
          })
        );
      }

      setLoading(false);
    };

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateProfile = <
    Field extends keyof ProfileForm,
  >(
    field: Field,
    value: ProfileForm[Field]
  ) => {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));

    setSuccess(null);
  };

  const updateBusinessHour = (
    dayOfWeek: number,
    changes: Partial<BusinessHour>
  ) => {
    setBusinessHours((currentHours) =>
      currentHours.map((hour) =>
        hour.dayOfWeek === dayOfWeek
          ? {
              ...hour,
              ...changes,
            }
          : hour
      )
    );

    setSuccess(null);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    if (
      !profile.professionalName.trim() ||
      !profile.businessName.trim()
    ) {
      setError(
        "Informe seu nome profissional e o nome do negócio."
      );
      return;
    }

    if (
      profile.bookingEnabled &&
      !profile.bookingSlug
    ) {
      setError(
        "Crie um endereço para ativar o agendamento público."
      );
      return;
    }

    const invalidHour = businessHours.find(
      (hour) =>
        hour.isOpen &&
        hour.startTime >= hour.endTime
    );

    if (invalidHour) {
      setError(
        `O horário final de ${invalidHour.label} precisa ser posterior ao inicial.`
      );
      return;
    }

    setSaving(true);

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setError(
        "Sua sessão expirou. Entre novamente."
      );
      setSaving(false);
      return;
    }

    const userId = userData.user.id;

    const { error: profileError } =
      await supabase
        .from("professional_profiles")
        .upsert(
          {
            user_id: userId,
            professional_name:
              profile.professionalName.trim(),
            business_name:
              profile.businessName.trim(),
            phone: profile.phone.trim() || null,
            address:
              profile.address.trim() || null,
            bio: profile.bio.trim() || null,
            booking_slug:
              profile.bookingSlug || null,
            booking_enabled:
              profile.bookingEnabled,
            timezone: "America/Sao_Paulo",
          },
          {
            onConflict: "user_id",
          }
        );

    if (profileError) {
      console.error(profileError);

      if (profileError.code === "23505") {
        setError(
          "Esse endereço público já está sendo utilizado. Escolha outro."
        );
      } else {
        setError(
          "Não foi possível salvar o perfil profissional."
        );
      }

      setSaving(false);
      return;
    }

    const { error: hoursError } =
      await supabase
        .from("business_hours")
        .upsert(
          businessHours.map((hour) => ({
            user_id: userId,
            day_of_week: hour.dayOfWeek,
            is_open: hour.isOpen,
            start_time: hour.isOpen
              ? hour.startTime
              : null,
            end_time: hour.isOpen
              ? hour.endTime
              : null,
          })),
          {
            onConflict: "user_id,day_of_week",
          }
        );

    if (hoursError) {
      console.error(hoursError);
      setError(
        "O perfil foi salvo, mas não foi possível salvar os horários."
      );
      setSaving(false);
      return;
    }

    setSuccess(
      "Configurações salvas com sucesso."
    );
    setSaving(false);
  };

  if (loading) {
    return (
      <section className="settings-page">
        <div className="settings-loading">
          <LoaderCircle
            className="settings-spin"
            size={30}
          />
          <span>
            Carregando configurações...
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="settings-page">
      <header className="settings-header">
        <div>
          <span className="settings-eyebrow">
            Sua conta
          </span>
          <h2>Configurações</h2>
          <p>
            Personalize seu negócio e defina os
            horários disponíveis para atendimento.
          </p>
        </div>
      </header>

      {error && (
        <div
          className="settings-message error"
          role="alert"
        >
          <XCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          className="settings-message success"
          role="status"
        >
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      <form
        className="settings-form"
        onSubmit={handleSubmit}
      >
        <article className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon blue">
              <Building2 size={21} />
            </div>
            <div>
              <h3>Perfil profissional</h3>
              <p>
                Informações exibidas para seus
                clientes.
              </p>
            </div>
          </div>

          <div className="settings-fields-grid">
            <label>
              <span>
                <UserRound size={15} />
                Nome profissional
              </span>
              <input
                type="text"
                value={profile.professionalName}
                required
                maxLength={80}
                placeholder="Como deseja ser chamado"
                onChange={(event) =>
                  updateProfile(
                    "professionalName",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              <span>
                <Building2 size={15} />
                Nome do negócio
              </span>
              <input
                type="text"
                value={profile.businessName}
                required
                maxLength={100}
                placeholder="Ex.: Studio William"
                onChange={(event) =>
                  updateProfile(
                    "businessName",
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
                value={profile.phone}
                maxLength={20}
                placeholder="(61) 99999-9999"
                onChange={(event) =>
                  updateProfile(
                    "phone",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              <span>
                <MapPin size={15} />
                Endereço
              </span>
              <input
                type="text"
                value={profile.address}
                maxLength={180}
                placeholder="Endereço do atendimento"
                onChange={(event) =>
                  updateProfile(
                    "address",
                    event.target.value
                  )
                }
              />
            </label>

            <label className="settings-field-full">
              <span>Descrição profissional</span>
              <textarea
                value={profile.bio}
                rows={4}
                maxLength={500}
                placeholder="Conte aos clientes um pouco sobre seu trabalho"
                onChange={(event) =>
                  updateProfile(
                    "bio",
                    event.target.value
                  )
                }
              />
              <small>
                {profile.bio.length}/500 caracteres
              </small>
            </label>
          </div>
        </article>

        <article className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon green">
              <Globe2 size={21} />
            </div>
            <div>
              <h3>Agendamento público</h3>
              <p>
                Prepare o endereço que seus clientes
                utilizarão futuramente.
              </p>
            </div>
          </div>

          <div className="settings-public-row">
            <label className="settings-slug-field">
              <span>Endereço personalizado</span>
              <div className="settings-slug-input">
                <span>/agendar/</span>
                <input
                  type="text"
                  value={profile.bookingSlug}
                  maxLength={60}
                  placeholder="meu-negocio"
                  onChange={(event) =>
                    updateProfile(
                      "bookingSlug",
                      normalizeSlug(
                        event.target.value
                      )
                    )
                  }
                />
              </div>
            </label>

            <label className="settings-switch-row">
              <span>
                <strong>
                  Ativar página pública
                </strong>
                <small>
                  Ficará disponível quando criarmos a
                  página de agendamento do cliente.
                </small>
              </span>

              <input
                type="checkbox"
                checked={profile.bookingEnabled}
                onChange={(event) =>
                  updateProfile(
                    "bookingEnabled",
                    event.target.checked
                  )
                }
              />
            </label>
          </div>
        </article>

        <article className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon purple">
              <Clock3 size={21} />
            </div>
            <div>
              <h3>Horários de atendimento</h3>
              <p>
                Defina os dias e períodos em que você
                atende.
              </p>
            </div>
          </div>

          <div className="business-hours-list">
            {businessHours.map((hour) => (
              <div
                key={hour.dayOfWeek}
                className={`business-hour-row ${
                  hour.isOpen ? "open" : "closed"
                }`}
              >
                <label className="business-day-toggle">
                  <input
                    type="checkbox"
                    checked={hour.isOpen}
                    onChange={(event) =>
                      updateBusinessHour(
                        hour.dayOfWeek,
                        {
                          isOpen:
                            event.target.checked,
                        }
                      )
                    }
                  />
                  <span>{hour.label}</span>
                </label>

                {hour.isOpen ? (
                  <div className="business-hour-inputs">
                    <input
                      type="time"
                      value={hour.startTime}
                      required
                      aria-label={`Início de ${hour.label}`}
                      onChange={(event) =>
                        updateBusinessHour(
                          hour.dayOfWeek,
                          {
                            startTime:
                              event.target.value,
                          }
                        )
                      }
                    />
                    <span>até</span>
                    <input
                      type="time"
                      value={hour.endTime}
                      required
                      aria-label={`Final de ${hour.label}`}
                      onChange={(event) =>
                        updateBusinessHour(
                          hour.dayOfWeek,
                          {
                            endTime:
                              event.target.value,
                          }
                        )
                      }
                    />
                  </div>
                ) : (
                  <span className="business-hour-closed">
                    Fechado
                  </span>
                )}
              </div>
            ))}
          </div>
        </article>

        <div className="settings-save-area">
          <div>
            <strong>Salvar configurações</strong>
            <span>
              As alterações serão aplicadas ao seu
              perfil profissional.
            </span>
          </div>

          <button
            type="submit"
            className="settings-save-button"
            disabled={saving}
          >
            {saving ? (
              <>
                <LoaderCircle
                  className="settings-spin"
                  size={18}
                />
                Salvando...
              </>
            ) : (
              <>
                <Save size={18} />
                Salvar alterações
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

export default SettingsPage;