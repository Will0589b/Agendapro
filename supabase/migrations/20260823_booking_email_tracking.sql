alter table public.appointments
add column if not exists confirmation_email_sent_at timestamptz,
add column if not exists confirmation_email_id text,
add column if not exists confirmation_email_error text,
add column if not exists reschedule_email_sent_at timestamptz,
add column if not exists reschedule_email_id text,
add column if not exists reschedule_email_error text,
add column if not exists cancellation_email_sent_at timestamptz,
add column if not exists cancellation_email_id text,
add column if not exists cancellation_email_error text;