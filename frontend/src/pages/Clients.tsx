import {
  useEffect,
  useState,
} from "react";
import type { FormEvent } from "react";

import {
  LoaderCircle,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import "./Clients.css";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

type ClientForm = {
  name: string;
  email: string;
  phone: string;
  notes: string;
};

const initialForm: ClientForm = {
  name: "",
  email: "",
  phone: "",
  notes: "",
};

const clientColumns =
  "id, name, email, phone, notes, created_at";

function Clients() {
  const [clients, setClients] =
    useState<Client[]>([]);

  const [form, setForm] =
    useState<ClientForm>(initialForm);

  const [editingClient, setEditingClient] =
    useState<Client | null>(null);

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
    const loadClients = async () => {
      setLoading(true);
      setError(null);

      const { data, error: loadError } =
        await supabase
          .from("clients")
          .select(clientColumns)
          .order("created_at", {
            ascending: false,
          });

      if (loadError) {
        setError(
          "Não foi possível carregar os clientes."
        );

        console.error(loadError);
      } else {
        setClients(data ?? []);
      }

      setLoading(false);
    };

    void loadClients();
  }, []);

  const openCreateForm = () => {
    setEditingClient(null);
    setForm(initialForm);
    setError(null);
    setShowForm(true);
  };

  const openEditForm = (client: Client) => {
    setEditingClient(client);

    setForm({
      name: client.name,
      email: client.email ?? "",
      phone: client.phone ?? "",
      notes: client.notes ?? "",
    });

    setError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingClient(null);
    setForm(initialForm);
    setError(null);
  };

  const updateFormField = (
    field: keyof ClientForm,
    value: string
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

    if (form.name.trim().length < 2) {
      setError(
        "Informe um nome com pelo menos 2 caracteres."
      );
      return;
    }

    setSaving(true);
    setError(null);

    const clientData = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
    };

    if (editingClient) {
      const { data, error: updateError } =
        await supabase
          .from("clients")
          .update(clientData)
          .eq("id", editingClient.id)
          .select(clientColumns)
          .single();

      if (updateError) {
        setError(
          "Não foi possível atualizar o cliente."
        );

        console.error(updateError);
        setSaving(false);
        return;
      }

      setClients((currentClients) =>
        currentClients.map((client) =>
          client.id === data.id
            ? data
            : client
        )
      );
    } else {
      const { data, error: insertError } =
        await supabase
          .from("clients")
          .insert(clientData)
          .select(clientColumns)
          .single();

      if (insertError) {
        setError(
          "Não foi possível cadastrar o cliente."
        );

        console.error(insertError);
        setSaving(false);
        return;
      }

      setClients((currentClients) => [
        data,
        ...currentClients,
      ]);
    }

    setSaving(false);
    setShowForm(false);
    setEditingClient(null);
    setForm(initialForm);
  };

  const handleDelete = async (
    client: Client
  ) => {
    const confirmed = window.confirm(
      `Deseja realmente excluir o cliente "${client.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(client.id);
    setError(null);

    const { error: deleteError } =
      await supabase
        .from("clients")
        .delete()
        .eq("id", client.id);

    if (deleteError) {
      setError(
        "Não foi possível excluir o cliente."
      );

      console.error(deleteError);
      setDeletingId(null);
      return;
    }

    setClients((currentClients) =>
      currentClients.filter(
        (currentClient) =>
          currentClient.id !== client.id
      )
    );

    setDeletingId(null);
  };

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  };

  const filteredClients = clients.filter(
    (client) => {
      const term = search
        .trim()
        .toLowerCase();

      if (!term) {
        return true;
      }

      return (
        client.name
          .toLowerCase()
          .includes(term) ||
        client.email
          ?.toLowerCase()
          .includes(term) ||
        client.phone?.includes(term)
      );
    }
  );

  return (
    <section className="clients-page">
      <header className="clients-header">
        <div>
          <p className="clients-eyebrow">
            Gestão de contatos
          </p>

          <h2>Clientes</h2>

          <p>
            Cadastre e organize seus clientes em
            um só lugar.
          </p>
        </div>

        <button
          type="button"
          className="clients-primary-button"
          onClick={openCreateForm}
        >
          <Plus size={20} />
          Novo cliente
        </button>
      </header>

      <div className="clients-toolbar">
        <div className="clients-search">
          <Search size={19} />

          <input
            type="search"
            placeholder="Buscar por nome, e-mail ou telefone"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <span className="clients-counter">
          {clients.length}{" "}
          {clients.length === 1
            ? "cliente"
            : "clientes"}
        </span>
      </div>

      {error && !showForm && (
        <div className="clients-error">
          {error}
        </div>
      )}

      <div className="clients-container">
        {loading ? (
          <div className="clients-loading">
            <LoaderCircle
              className="clients-spin"
              size={30}
            />

            <p>Carregando clientes...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="clients-empty">
            <div className="clients-empty-icon">
              <Users size={31} />
            </div>

            <h3>
              {search
                ? "Nenhum cliente encontrado"
                : "Nenhum cliente cadastrado"}
            </h3>

            <p>
              {search
                ? "Tente buscar utilizando outro termo."
                : "Cadastre seu primeiro cliente para começar."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openCreateForm}
              >
                <UserPlus size={18} />
                Cadastrar primeiro cliente
              </button>
            )}
          </div>
        ) : (
          <div className="clients-list">
            {filteredClients.map((client) => (
              <article
                className="client-card"
                key={client.id}
              >
                <div className="client-avatar">
                  {getInitials(client.name)}
                </div>

                <div className="client-details">
                  <h3>{client.name}</h3>

                  <div className="client-contacts">
                    <span>
                      <Mail size={15} />

                      {client.email ||
                        "E-mail não informado"}
                    </span>

                    <span>
                      <Phone size={15} />

                      {client.phone ||
                        "Telefone não informado"}
                    </span>
                  </div>

                  {client.notes && (
                    <p className="client-notes">
                      {client.notes}
                    </p>
                  )}
                </div>

                <div className="client-actions">
                  <button
                    type="button"
                    className="client-action-button edit"
                    onClick={() =>
                      openEditForm(client)
                    }
                    aria-label={`Editar ${client.name}`}
                    title="Editar cliente"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    className="client-action-button delete"
                    disabled={
                      deletingId === client.id
                    }
                    onClick={() =>
                      handleDelete(client)
                    }
                    aria-label={`Excluir ${client.name}`}
                    title="Excluir cliente"
                  >
                    {deletingId === client.id ? (
                      <LoaderCircle
                        className="clients-spin"
                        size={16}
                      />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="client-modal-overlay"
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
            className="client-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-modal-title"
          >
            <div className="client-modal-header">
              <div>
                <span>
                  {editingClient ? (
                    <Pencil size={21} />
                  ) : (
                    <UserPlus size={21} />
                  )}
                </span>

                <div>
                  <h3 id="client-modal-title">
                    {editingClient
                      ? "Editar cliente"
                      : "Novo cliente"}
                  </h3>

                  <p>
                    {editingClient
                      ? "Atualize os dados do cliente."
                      : "Preencha os dados principais."}
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
              className="client-form"
              onSubmit={handleSubmit}
            >
              {error && (
                <div className="clients-error">
                  {error}
                </div>
              )}

              <label>
                Nome completo

                <input
                  type="text"
                  value={form.name}
                  placeholder="Ex.: Ana Ferreira"
                  required
                  minLength={2}
                  autoFocus
                  onChange={(event) =>
                    updateFormField(
                      "name",
                      event.target.value
                    )
                  }
                />
              </label>

              <div className="client-form-row">
                <label>
                  E-mail

                  <input
                    type="email"
                    value={form.email}
                    placeholder="cliente@email.com"
                    onChange={(event) =>
                      updateFormField(
                        "email",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Telefone

                  <input
                    type="tel"
                    value={form.phone}
                    placeholder="(61) 99999-9999"
                    onChange={(event) =>
                      updateFormField(
                        "phone",
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>

              <label>
                Observações

                <textarea
                  value={form.notes}
                  placeholder="Informações adicionais sobre o cliente"
                  rows={4}
                  onChange={(event) =>
                    updateFormField(
                      "notes",
                      event.target.value
                    )
                  }
                />
              </label>

              <div className="client-form-actions">
                <button
                  type="button"
                  className="client-cancel-button"
                  disabled={saving}
                  onClick={closeForm}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="clients-primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        className="clients-spin"
                        size={18}
                      />

                      Salvando...
                    </>
                  ) : editingClient ? (
                    <>
                      <Pencil size={18} />
                      Salvar alterações
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Cadastrar cliente
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

export default Clients;