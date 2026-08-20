import {
  useEffect,
  useState,
} from "react";
import type { FormEvent } from "react";
import type { LucideIcon } from "lucide-react";

import {
  Banknote,
  BriefcaseBusiness,
  Camera,
  Check,
  Clock3,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  LoaderCircle,
  Monitor,
  Pencil,
  Plus,
  Scissors,
  Search,
  Sparkles,
  Trash2,
  Wrench,
  X,
} from "lucide-react";

import {
  serviceTemplates,
  type ServiceIcon,
  type ServiceTemplate,
} from "../data/serviceTemplates";

import { supabase } from "../lib/supabase";
import "./Services.css";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  active: boolean;
  icon: ServiceIcon;
  created_at: string;
};

type ServiceForm = {
  name: string;
  description: string;
  duration: string;
  price: string;
  active: boolean;
  icon: ServiceIcon;
};

const serviceIconComponents: Record<
  ServiceIcon,
  LucideIcon
> = {
  scissors: Scissors,
  heart: HeartPulse,
  briefcase: BriefcaseBusiness,
  graduation: GraduationCap,
  camera: Camera,
  wrench: Wrench,
  monitor: Monitor,
  dumbbell: Dumbbell,
  sparkles: Sparkles,
};

const categoryOptions: Array<{
  value: ServiceIcon;
  label: string;
}> = [
  {
    value: "scissors",
    label: "Beleza e cabelo",
  },
  {
    value: "heart",
    label: "Saúde e bem-estar",
  },
  {
    value: "briefcase",
    label: "Serviços profissionais",
  },
  {
    value: "graduation",
    label: "Educação",
  },
  {
    value: "camera",
    label: "Fotografia e vídeo",
  },
  {
    value: "wrench",
    label: "Manutenção",
  },
  {
    value: "monitor",
    label: "Tecnologia",
  },
  {
    value: "dumbbell",
    label: "Atividade física",
  },
  {
    value: "sparkles",
    label: "Outros",
  },
];

const initialForm: ServiceForm = {
  name: "",
  description: "",
  duration: "30",
  price: "",
  active: true,
  icon: "sparkles",
};

const serviceColumns =
  "id, name, description, duration_minutes, price, active, icon, created_at";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function Services() {
  const [services, setServices] =
    useState<Service[]>([]);

  const [form, setForm] =
    useState<ServiceForm>(initialForm);

  const [editingService, setEditingService] =
    useState<Service | null>(null);

  const [
    selectedTemplate,
    setSelectedTemplate,
  ] = useState<ServiceTemplate | null>(null);

  const [templateSearch, setTemplateSearch] =
    useState("");

  const [customMode, setCustomMode] =
    useState(false);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [showForm, setShowForm] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);
      setError(null);

      const { data, error: loadError } =
        await supabase
          .from("services")
          .select(serviceColumns)
          .order("created_at", {
            ascending: false,
          });

      if (loadError) {
        setError(
          "Não foi possível carregar os serviços."
        );

        console.error(loadError);
      } else {
        setServices(data ?? []);
      }

      setLoading(false);
    };

    void loadServices();
  }, []);

  const openCreateForm = () => {
    setEditingService(null);
    setSelectedTemplate(null);
    setTemplateSearch("");
    setCustomMode(false);
    setForm(initialForm);
    setError(null);
    setShowForm(true);
  };

  const openEditForm = (
    service: Service
  ) => {
    setEditingService(service);
    setSelectedTemplate(null);
    setTemplateSearch("");
    setCustomMode(false);

    setForm({
      name: service.name,
      description:
        service.description ?? "",
      duration: String(
        service.duration_minutes
      ),
      price: String(service.price),
      active: service.active,
      icon: service.icon,
    });

    setError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingService(null);
    setSelectedTemplate(null);
    setTemplateSearch("");
    setCustomMode(false);
    setForm(initialForm);
    setError(null);
  };

  const selectTemplate = (
    template: ServiceTemplate
  ) => {
    setSelectedTemplate(template);
    setCustomMode(false);
    setTemplateSearch(template.name);

    setForm({
      name: template.name,
      description: template.description,
      duration: String(template.duration),
      price: "",
      active: true,
      icon: template.icon,
    });

    setError(null);
  };

  const startCustomService = () => {
    const typedName =
      templateSearch.trim();

    setSelectedTemplate(null);
    setCustomMode(true);

    setForm({
      ...initialForm,
      name: typedName,
    });

    setError(null);
  };

  const chooseAnotherService = () => {
    setSelectedTemplate(null);
    setCustomMode(false);
    setTemplateSearch("");
    setForm(initialForm);
    setError(null);
  };

  const updateFormField = (
    field: keyof ServiceForm,
    value: string | boolean
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const duration = Number(form.duration);

    const price = Number(
      form.price.replace(",", ".")
    );

    if (
      !editingService &&
      !selectedTemplate &&
      !customMode
    ) {
      setError(
        "Selecione um serviço ou crie um serviço personalizado."
      );
      return;
    }

    if (form.name.trim().length < 2) {
      setError(
        "Informe um nome com pelo menos 2 caracteres."
      );
      return;
    }

    if (
      !Number.isInteger(duration) ||
      duration <= 0
    ) {
      setError(
        "Informe uma duração válida em minutos."
      );
      return;
    }

    if (
      Number.isNaN(price) ||
      price < 0
    ) {
      setError("Informe um preço válido.");
      return;
    }

    setSaving(true);
    setError(null);

    const serviceData = {
      name: form.name.trim(),
      description:
        form.description.trim() || null,
      duration_minutes: duration,
      price,
      active: form.active,
      icon: form.icon,
    };

    if (editingService) {
      const { data, error: updateError } =
        await supabase
          .from("services")
          .update(serviceData)
          .eq("id", editingService.id)
          .select(serviceColumns)
          .single();

      if (updateError) {
        setError(
          "Não foi possível atualizar o serviço."
        );

        console.error(updateError);
        setSaving(false);
        return;
      }

      setServices((currentServices) =>
        currentServices.map((service) =>
          service.id === data.id
            ? data
            : service
        )
      );
    } else {
      const { data, error: insertError } =
        await supabase
          .from("services")
          .insert(serviceData)
          .select(serviceColumns)
          .single();

      if (insertError) {
        setError(
          "Não foi possível cadastrar o serviço."
        );

        console.error(insertError);
        setSaving(false);
        return;
      }

      setServices((currentServices) => [
        data,
        ...currentServices,
      ]);
    }

    setSaving(false);
    setShowForm(false);
    setEditingService(null);
    setSelectedTemplate(null);
    setTemplateSearch("");
    setCustomMode(false);
    setForm(initialForm);
  };

  const handleDelete = async (
    service: Service
  ) => {
    const confirmed = window.confirm(
      `Deseja realmente excluir o serviço "${service.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(service.id);
    setError(null);

    const { error: deleteError } =
      await supabase
        .from("services")
        .delete()
        .eq("id", service.id);

    if (deleteError) {
      setError(
        "Não foi possível excluir o serviço."
      );

      console.error(deleteError);
      setDeletingId(null);
      return;
    }

    setServices((currentServices) =>
      currentServices.filter(
        (currentService) =>
          currentService.id !== service.id
      )
    );

    setDeletingId(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    ).format(price);
  };

  const normalizedTemplateSearch =
    normalizeText(templateSearch);

  const filteredTemplates =
    serviceTemplates
      .filter((template) => {
        if (!normalizedTemplateSearch) {
          return true;
        }

        const searchableText =
          normalizeText(
            `${template.name} ${template.category}`
          );

        return searchableText.includes(
          normalizedTemplateSearch
        );
      })
      .slice(0, 10);

  const filteredServices =
    services.filter((service) => {
      const term = normalizeText(search);

      if (!term) {
        return true;
      }

      return normalizeText(
        `${service.name} ${
          service.description ?? ""
        }`
      ).includes(term);
    });

  const showServiceFields =
    editingService !== null ||
    selectedTemplate !== null ||
    customMode;

  const CurrentFormIcon =
    serviceIconComponents[form.icon] ??
    Sparkles;

  return (
    <section className="services-page">
      <header className="services-header">
        <div>
          <p className="services-eyebrow">
            Catálogo profissional
          </p>

          <h2>Serviços</h2>

          <p>
            Organize os serviços, valores e
            durações oferecidos.
          </p>
        </div>

        <button
          type="button"
          className="services-primary-button"
          onClick={openCreateForm}
        >
          <Plus size={20} />
          Novo serviço
        </button>
      </header>

      <div className="services-toolbar">
        <div className="services-search">
          <Search size={19} />

          <input
            type="search"
            placeholder="Buscar serviço cadastrado"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <span className="services-counter">
          {services.length}{" "}
          {services.length === 1
            ? "serviço"
            : "serviços"}
        </span>
      </div>

      {error && !showForm && (
        <div className="services-error">
          {error}
        </div>
      )}

      <div className="services-container">
        {loading ? (
          <div className="services-loading">
            <LoaderCircle
              className="services-spin"
              size={30}
            />

            <p>Carregando serviços...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="services-empty">
            <div className="services-empty-icon">
              <BriefcaseBusiness size={31} />
            </div>

            <h3>
              {search
                ? "Nenhum serviço encontrado"
                : "Nenhum serviço cadastrado"}
            </h3>

            <p>
              {search
                ? "Tente buscar utilizando outro termo."
                : "Cadastre seu primeiro serviço para começar."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openCreateForm}
              >
                <Plus size={18} />
                Cadastrar primeiro serviço
              </button>
            )}
          </div>
        ) : (
          <div className="services-list">
            {filteredServices.map(
              (service) => {
                const ServiceIconComponent =
                  serviceIconComponents[
                    service.icon
                  ] ?? BriefcaseBusiness;

                return (
                  <article
                    className="service-card"
                    key={service.id}
                  >
                    <div className="service-card-top">
                      <div className="service-icon">
                        <ServiceIconComponent
                          size={22}
                        />
                      </div>

                      <span
                        className={`service-status ${
                          service.active
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {service.active
                          ? "Ativo"
                          : "Inativo"}
                      </span>
                    </div>

                    <div className="service-details">
                      <h3>{service.name}</h3>

                      <p>
                        {service.description ||
                          "Sem descrição cadastrada."}
                      </p>
                    </div>

                    <div className="service-information">
                      <span>
                        <Clock3 size={17} />

                        {
                          service.duration_minutes
                        }{" "}
                        min
                      </span>

                      <strong>
                        <Banknote size={17} />

                        {formatPrice(
                          service.price
                        )}
                      </strong>
                    </div>

                    <div className="service-actions">
                      <button
                        type="button"
                        className="service-edit-button"
                        onClick={() =>
                          openEditForm(service)
                        }
                      >
                        <Pencil size={16} />
                        Editar
                      </button>

                      <button
                        type="button"
                        className="service-delete-button"
                        disabled={
                          deletingId ===
                          service.id
                        }
                        onClick={() =>
                          handleDelete(service)
                        }
                        aria-label={`Excluir ${service.name}`}
                        title="Excluir serviço"
                      >
                        {deletingId ===
                        service.id ? (
                          <LoaderCircle
                            className="services-spin"
                            size={16}
                          />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="service-modal-overlay"
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
            className="service-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-modal-title"
          >
            <div className="service-modal-header">
              <div>
                <span>
                  {editingService ? (
                    <Pencil size={21} />
                  ) : (
                    <BriefcaseBusiness
                      size={21}
                    />
                  )}
                </span>

                <div>
                  <h3 id="service-modal-title">
                    {editingService
                      ? "Editar serviço"
                      : "Novo serviço"}
                  </h3>

                  <p>
                    Escolha um serviço ou crie
                    um personalizado.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Fechar formulário"
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="service-form"
              onSubmit={handleSubmit}
            >
              {error && (
                <div className="services-error">
                  {error}
                </div>
              )}

              {!editingService &&
                !selectedTemplate &&
                !customMode && (
                  <div className="service-template-area">
                    <span className="service-template-label">
                      Qual serviço você oferece?
                    </span>

                    <div className="service-template-search">
                      <Search size={18} />

                      <input
                        type="search"
                        value={templateSearch}
                        placeholder="Pesquise por corte, consulta, aula..."
                        autoFocus
                        onChange={(event) =>
                          setTemplateSearch(
                            event.target.value
                          )
                        }
                      />
                    </div>

                    <div className="service-template-results">
                      {filteredTemplates.length >
                      0 ? (
                        filteredTemplates.map(
                          (template) => {
                            const TemplateIcon =
                              serviceIconComponents[
                                template.icon
                              ];

                            return (
                              <button
                                type="button"
                                className="service-template-option"
                                key={template.id}
                                onClick={() =>
                                  selectTemplate(
                                    template
                                  )
                                }
                              >
                                <span className="template-option-icon">
                                  <TemplateIcon
                                    size={20}
                                  />
                                </span>

                                <span className="template-option-text">
                                  <strong>
                                    {template.name}
                                  </strong>

                                  <small>
                                    {
                                      template.category
                                    }{" "}
                                    •{" "}
                                    {
                                      template.duration
                                    }{" "}
                                    min
                                  </small>
                                </span>

                                <Check
                                  className="template-option-check"
                                  size={17}
                                />
                              </button>
                            );
                          }
                        )
                      ) : (
                        <div className="service-template-not-found">
                          Nenhum serviço encontrado.
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="service-custom-button"
                      onClick={startCustomService}
                    >
                      <Plus size={18} />

                      <span>
                        <strong>
                          Criar serviço
                          personalizado
                        </strong>

                        <small>
                          Cadastre um serviço que
                          não está na lista
                        </small>
                      </span>
                    </button>
                  </div>
                )}

              {showServiceFields && (
                <>
                  {!editingService && (
                    <div className="selected-service-preview">
                      <span className="selected-service-icon">
                        <CurrentFormIcon
                          size={22}
                        />
                      </span>

                      <span>
                        <strong>
                          {selectedTemplate
                            ? "Serviço selecionado"
                            : "Serviço personalizado"}
                        </strong>

                        <small>
                          {form.name ||
                            "Informe o nome do serviço"}
                        </small>
                      </span>

                      <button
                        type="button"
                        onClick={chooseAnotherService}
                      >
                        Trocar
                      </button>
                    </div>
                  )}

                  <label>
                    Nome do serviço

                    <input
                      type="text"
                      value={form.name}
                      placeholder="Ex.: Corte de cabelo"
                      required
                      minLength={2}
                      autoFocus={
                        customMode ||
                        editingService !== null
                      }
                      onChange={(event) =>
                        updateFormField(
                          "name",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  {customMode && (
                    <label>
                      Categoria do serviço

                      <select
                        value={form.icon}
                        onChange={(event) =>
                          updateFormField(
                            "icon",
                            event.target
                              .value as ServiceIcon
                          )
                        }
                      >
                        {categoryOptions.map(
                          (option) => (
                            <option
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  )}

                  <label>
                    Descrição

                    <textarea
                      value={form.description}
                      placeholder="Descreva o serviço oferecido"
                      rows={3}
                      onChange={(event) =>
                        updateFormField(
                          "description",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <div className="service-form-row">
                    <label>
                      Duração em minutos

                      <input
                        type="number"
                        value={form.duration}
                        min="1"
                        step="1"
                        required
                        onChange={(event) =>
                          updateFormField(
                            "duration",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      Preço em reais

                      <input
                        type="number"
                        value={form.price}
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        required
                        onChange={(event) =>
                          updateFormField(
                            "price",
                            event.target.value
                          )
                        }
                      />
                    </label>
                  </div>

                  <label className="service-active-field">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(event) =>
                        updateFormField(
                          "active",
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      <strong>
                        Serviço ativo
                      </strong>

                      <small>
                        Permitir novos
                        agendamentos para este
                        serviço
                      </small>
                    </span>
                  </label>

                  <div className="service-form-actions">
                    <button
                      type="button"
                      className="service-cancel-button"
                      disabled={saving}
                      onClick={closeForm}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="services-primary-button"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <LoaderCircle
                            className="services-spin"
                            size={18}
                          />
                          Salvando...
                        </>
                      ) : editingService ? (
                        <>
                          <Pencil size={18} />
                          Salvar alterações
                        </>
                      ) : (
                        <>
                          <Plus size={18} />
                          Cadastrar serviço
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Services;