// AgendaPro: confirmação inicial, reagendamento e cancelamento.
import { createClient } from "npm:@supabase/supabase-js@2";

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: {
    id?: string;
    user_id?: string;
    starts_at?: string;
    status?: string;
  };
  old_record?: {
    id?: string;
    user_id?: string;
    starts_at?: string;
    status?: string;
  };
};

type AppointmentRelation = {
  management_token: string;
  id: string;
  user_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  confirmation_email_sent_at: string | null;
  reschedule_email_sent_at: string | null;
  cancellation_email_sent_at: string | null;
  client:
    | {
        name: string;
        email: string | null;
      }
    | Array<{
        name: string;
        email: string | null;
      }>
    | null;
  service:
    | {
        name: string;
      }
    | Array<{
        name: string;
      }>
    | null;
};

type ProfessionalProfile = {
  professional_name: string;
  business_name: string;
  timezone: string | null;
};

const jsonResponse = (
  body: Record<string, unknown>,
  status = 200,
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const safeEqual = (first: string, second: string) => {
  if (first.length !== second.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < first.length; index += 1) {
    difference |=
      first.charCodeAt(index) ^ second.charCodeAt(index);
  }

  return difference === 0;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const normalizeRelation = <Relation>(
  value: Relation | Relation[] | null,
) => (Array.isArray(value) ? value[0] ?? null : value);

const getSupabaseSecretKey = () => {
  const legacyKey = Deno.env.get(
    "SUPABASE_SERVICE_ROLE_KEY",
  );

  if (legacyKey) {
    return legacyKey;
  }

  const serializedKeys = Deno.env.get(
    "SUPABASE_SECRET_KEYS",
  );

  if (!serializedKeys) {
    return null;
  }

  try {
    const keys = JSON.parse(serializedKeys) as Record<
      string,
      string
    >;

    return keys.default ?? Object.values(keys)[0] ?? null;
  } catch {
    return null;
  }
};

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse(
      { error: "Método não permitido." },
      405,
    );
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("EMAIL_FROM");
  const publicSiteUrl = Deno.env.get(
    "PUBLIC_SITE_URL",
  );
  const testEmailTo = Deno.env.get("TEST_EMAIL_TO");
  const webhookSecret = Deno.env.get(
    "EMAIL_WEBHOOK_SECRET",
  );
  const providedSecret = request.headers.get(
    "x-email-webhook-secret",
  );

  if (
    !webhookSecret ||
    !providedSecret ||
    !safeEqual(providedSecret, webhookSecret)
  ) {
    return jsonResponse(
      { error: "Não autorizado." },
      401,
    );
  }

  if (
    !resendApiKey ||
    !emailFrom ||
    !publicSiteUrl
  ) {
    return jsonResponse(
      { error: "Secrets de e-mail não configurados." },
      500,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseSecretKey = getSupabaseSecretKey();

  if (!supabaseUrl || !supabaseSecretKey) {
    return jsonResponse(
      { error: "Configuração do Supabase indisponível." },
      500,
    );
  }

  let payload: WebhookPayload;

  try {
    payload = (await request.json()) as WebhookPayload;
  } catch {
    return jsonResponse(
      { error: "Corpo da requisição inválido." },
      400,
    );
  }

  const eventType = (payload.type || "INSERT").toUpperCase();

  if (eventType !== "INSERT" && eventType !== "UPDATE") {
    return jsonResponse({
      ok: true,
      skipped: true,
      reason: "Evento ignorado.",
    });
  }

  const wasCancelled =
    eventType === "UPDATE" &&
    payload.record?.status === "cancelled" &&
    payload.old_record?.status !== "cancelled";

  const isReschedule =
    eventType === "UPDATE" &&
    !wasCancelled &&
    Boolean(payload.old_record?.starts_at) &&
    payload.old_record?.starts_at !== payload.record?.starts_at;

  if (
    eventType === "UPDATE" &&
    !isReschedule &&
    !wasCancelled
  ) {
    return jsonResponse({
      ok: true,
      skipped: true,
      reason: "Atualização sem alteração de horário.",
    });
  }

  const appointmentId = payload.record?.id;

  if (!appointmentId) {
    return jsonResponse(
      { error: "Agendamento não informado." },
      400,
    );
  }

  const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const { data: appointmentData, error: appointmentError } =
    await supabaseAdmin
      .from("appointments")
      .select(`
        id,
        user_id,
        starts_at,
        ends_at,
        status,
        management_token,
        confirmation_email_sent_at,
        reschedule_email_sent_at,
        cancellation_email_sent_at,
        client:clients!appointments_client_owner_fkey (
          name,
          email
        ),
        service:services!appointments_service_owner_fkey (
          name
        )
      `)
      .eq("id", appointmentId)
      .maybeSingle();

  if (appointmentError || !appointmentData) {
    console.error(appointmentError);

    return jsonResponse(
      { error: "Agendamento não encontrado." },
      404,
    );
  }

  const appointment =
    appointmentData as unknown as AppointmentRelation;

  if (
    eventType === "INSERT" &&
    appointment.confirmation_email_sent_at
  ) {
    return jsonResponse({
      ok: true,
      skipped: true,
      reason: "Confirmação já enviada.",
    });
  }

  const client = normalizeRelation(appointment.client);
  const service = normalizeRelation(appointment.service);

  if (!client || !service) {
    return jsonResponse(
      { error: "Cliente ou serviço não encontrado." },
      422,
    );
  }

  const { data: profileData, error: profileError } =
    await supabaseAdmin
      .from("professional_profiles")
      .select(`
        professional_name,
        business_name,
        timezone
      `)
      .eq("user_id", appointment.user_id)
      .maybeSingle();

  if (profileError || !profileData) {
    console.error(profileError);

    return jsonResponse(
      { error: "Perfil profissional não encontrado." },
      404,
    );
  }

  const profile = profileData as ProfessionalProfile;
  const recipient = testEmailTo || client.email;

  if (!recipient) {
    const errorMessage =
      "O cliente não informou um endereço de e-mail.";

    const errorColumn = wasCancelled
      ? "cancellation_email_error"
      : isReschedule
        ? "reschedule_email_error"
        : "confirmation_email_error";

    await supabaseAdmin
      .from("appointments")
      .update({
        [errorColumn]: errorMessage,
      })
      .eq("id", appointment.id);

    return jsonResponse({
      ok: true,
      skipped: true,
      reason: errorMessage,
    });
  }

  const timezone =
    profile.timezone || "America/Sao_Paulo";

  const appointmentDate = new Intl.DateTimeFormat(
    "pt-BR",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: timezone,
    },
  ).format(new Date(appointment.starts_at));

  const formatTime = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    }).format(new Date(value));

  const startTime = formatTime(appointment.starts_at);
  const endTime = formatTime(appointment.ends_at);
  const clientName = escapeHtml(client.name);
  const serviceName = escapeHtml(service.name);
  const businessName = escapeHtml(profile.business_name);
  const professionalName = escapeHtml(
    profile.professional_name,
  );
  const emailTitle = wasCancelled
    ? "Agendamento cancelado"
    : isReschedule
      ? "Agendamento reagendado"
      : "Agendamento confirmado";
  const emailIntroduction = wasCancelled
    ? `Olá, ${clientName}! O cancelamento do seu atendimento foi confirmado.`
    : isReschedule
      ? `Olá, ${clientName}! Seu atendimento foi reagendado com sucesso.`
      : `Olá, ${clientName}! Seu horário foi reservado com sucesso.`;
  const managementButtonText = wasCancelled
    ? "Agendar outro horário"
    : "Gerenciar agendamento";
  const assistanceText = wasCancelled
    ? `Se desejar marcar um novo atendimento, utilize o botão acima ou entre em contato com ${businessName}.`
    : `Caso precise alterar o horário, entre em contato diretamente com ${businessName}.`;
  const footerText = wasCancelled
    ? "Cancelamento confirmado com AgendaPro"
    : isReschedule
      ? "Reagendamento confirmado com AgendaPro"
      : "Agendamento realizado com AgendaPro";
  const managementUrl =
    `${publicSiteUrl.replace(/\/+$/, "")}` +
    `/agendamento/${appointment.management_token}`;
  const testNotice = testEmailTo
    ? `<p style="margin:20px 0 0;color:#64748b;font-size:12px;line-height:1.6;">
        Mensagem de teste: em produção, este e-mail será enviado para
        ${escapeHtml(client.email || "o e-mail informado pelo cliente")}.
      </p>`
    : "";

  const resendResponse = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": wasCancelled
          ? `booking-cancellation-${appointment.id}`
          : isReschedule
            ? `booking-reschedule-${appointment.id}-${appointment.starts_at}`
            : `booking-confirmation-${appointment.id}`,
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [recipient],
        subject: `${emailTitle} — ${profile.business_name}`,
        html: `
          <!doctype html>
          <html lang="pt-BR">
            <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
              <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
                <div style="overflow:hidden;background:#ffffff;border:1px solid #e2e8f0;border-radius:22px;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
                  <div style="padding:28px;background:linear-gradient(110deg,#eff6ff,#ecfdf5);border-bottom:1px solid #e2e8f0;">
                    <div style="color:#14b8a6;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;">
                      AgendaPro
                    </div>
                    <h1 style="margin:8px 0 6px;color:#0d1640;font-size:25px;">
                      ${emailTitle}
                    </h1>
                    <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">
                      ${emailIntroduction}
                    </p>
                  </div>

                  <div style="padding:28px;">
                    <div style="padding:18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:15px;">
                      <p style="margin:0 0 12px;color:#0d1640;font-size:15px;font-weight:700;">
                        Detalhes do atendimento
                      </p>
                      <p style="margin:7px 0;color:#475569;font-size:14px;">
                        <strong>Serviço:</strong> ${serviceName}
                      </p>
                      <p style="margin:7px 0;color:#475569;font-size:14px;text-transform:capitalize;">
                        <strong>Data:</strong> ${escapeHtml(appointmentDate)}
                      </p>
                      <p style="margin:7px 0;color:#475569;font-size:14px;">
                        <strong>Horário:</strong> ${startTime} – ${endTime}
                      </p>
                      <p style="margin:7px 0;color:#475569;font-size:14px;">
                        <strong>Profissional:</strong> ${professionalName}
                      </p>
                    </div>

                    <div style="margin:24px 0;text-align:center;">
                      <a
                        href="${escapeHtml(managementUrl)}"
                        style="display:inline-block;padding:13px 22px;color:#ffffff;background:#2563eb;border-radius:12px;text-decoration:none;font-size:14px;font-weight:700;"
                      >
                        ${managementButtonText}
                      </a>
                    </div>

                    <p style="margin:20px 0 0;color:#64748b;font-size:13px;line-height:1.65;">
                      ${assistanceText}
                    </p>

                    ${testNotice}
                  </div>

                  <div style="padding:18px 28px;color:#94a3b8;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;text-align:center;">
                    ${footerText}
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    },
  );

  const resendData = (await resendResponse.json()) as {
    id?: string;
    message?: string;
    name?: string;
  };

  if (!resendResponse.ok) {
    const errorMessage =
      resendData.message ||
      resendData.name ||
      "A Resend recusou o envio.";

    console.error(resendData);

    const errorColumn = wasCancelled
      ? "cancellation_email_error"
      : isReschedule
        ? "reschedule_email_error"
        : "confirmation_email_error";

    await supabaseAdmin
      .from("appointments")
      .update({
        [errorColumn]: errorMessage.slice(0, 500),
      })
      .eq("id", appointment.id);

    return jsonResponse(
      { error: errorMessage },
      502,
    );
  }

  const sentAt = new Date().toISOString();

  const trackingUpdate = wasCancelled
    ? {
        cancellation_email_sent_at: sentAt,
        cancellation_email_id: resendData.id ?? null,
        cancellation_email_error: null,
      }
    : isReschedule
      ? {
          reschedule_email_sent_at: sentAt,
          reschedule_email_id: resendData.id ?? null,
          reschedule_email_error: null,
        }
      : {
          confirmation_email_sent_at: sentAt,
          confirmation_email_id: resendData.id ?? null,
          confirmation_email_error: null,
        };

  await supabaseAdmin
    .from("appointments")
    .update(trackingUpdate)
    .eq("id", appointment.id);

  return jsonResponse({
    ok: true,
    emailId: resendData.id ?? null,
    sentAt,
    testMode: Boolean(testEmailTo),
    event: wasCancelled
      ? "cancelled"
      : isReschedule
        ? "rescheduled"
        : "created",
  });
});