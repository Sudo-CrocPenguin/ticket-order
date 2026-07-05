-- Ticket Order Supabase schema.
-- Run this once in Supabase SQL Editor before using the Expo app.

begin;

create extension if not exists pgcrypto;

do $$
begin
  create type public.ticket_status as enum ('pending', 'in_progress', 'completed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.ticket_priority as enum ('low', 'medium', 'high', 'critical');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.user_role as enum ('admin', 'developer', 'viewer');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.evidence_type as enum ('image', 'document');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  slug text not null unique check (char_length(trim(slug)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  email text not null unique check (char_length(trim(email)) between 1 and 180),
  role public.user_role not null default 'developer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 300),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists applications_company_name_unique
  on public.applications (company_id, lower(trim(name)));

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete restrict,
  created_by_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 1200),
  status public.ticket_status not null default 'pending',
  priority public.ticket_priority not null default 'medium',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tickets_company_updated_at_idx
  on public.tickets (company_id, updated_at desc);

create table if not exists public.ticket_status_logs (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  from_status public.ticket_status,
  to_status public.ticket_status not null,
  changed_by_id uuid not null references public.profiles(id) on delete restrict,
  note text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists ticket_status_logs_ticket_created_at_idx
  on public.ticket_status_logs (ticket_id, created_at desc);

create table if not exists public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists ticket_comments_ticket_created_at_idx
  on public.ticket_comments (ticket_id, created_at desc);

create table if not exists public.evidences (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  uploaded_by_id uuid not null references public.profiles(id) on delete restrict,
  file_name text not null check (char_length(trim(file_name)) between 1 and 180),
  mime_type text not null,
  type public.evidence_type not null,
  size integer not null check (size > 0 and size <= 10485760),
  storage_path text not null unique check (char_length(storage_path) <= 500),
  public_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists evidences_ticket_created_at_idx
  on public.evidences (ticket_id, created_at desc);

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  token text not null unique check (char_length(trim(token)) between 20 and 300),
  platform text not null default 'unknown' check (platform in ('ios', 'android', 'web', 'unknown')),
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_company_active_idx
  on public.push_tokens (company_id, is_active);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ticket_id uuid references public.tickets(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('ticket_created', 'ticket_status_changed')),
  title text not null check (char_length(trim(title)) between 1 and 120),
  body text not null check (char_length(trim(body)) between 1 and 500),
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists notification_events_pending_idx
  on public.notification_events (created_at)
  where sent_at is null;

create index if not exists notification_events_company_idx
  on public.notification_events (company_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_companies_updated_at on public.companies;
create trigger set_companies_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_applications_updated_at on public.applications;
create trigger set_applications_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

drop trigger if exists set_tickets_updated_at on public.tickets;
create trigger set_tickets_updated_at
before update on public.tickets
for each row execute function public.set_updated_at();

drop trigger if exists set_evidences_updated_at on public.evidences;
create trigger set_evidences_updated_at
before update on public.evidences
for each row execute function public.set_updated_at();

drop trigger if exists set_push_tokens_updated_at on public.push_tokens;
create trigger set_push_tokens_updated_at
before update on public.push_tokens
for each row execute function public.set_updated_at();

create or replace function public.slugify(value text)
returns text
language plpgsql
immutable
as $$
declare
  next_slug text;
begin
  next_slug := lower(regexp_replace(trim(coalesce(value, '')), '[^a-zA-Z0-9]+', '-', 'g'));
  next_slug := regexp_replace(next_slug, '(^-|-$)', '', 'g');
  return nullif(next_slug, '');
end;
$$;

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id
  from public.profiles
  where id = auth.uid()
    and is_active = true
  limit 1;
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.can_write_tickets()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('admin', 'developer'), false);
$$;

create or replace function public.ensure_active_admin_remains()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  other_active_admins integer;
  old_was_active_admin boolean;
  new_is_same_active_admin boolean;
begin
  old_was_active_admin := old.role = 'admin' and old.is_active = true;

  if not old_was_active_admin then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    new_is_same_active_admin := false;
  else
    new_is_same_active_admin :=
      new.company_id = old.company_id and new.role = 'admin' and new.is_active = true;
  end if;

  if new_is_same_active_admin then
    return new;
  end if;

  select count(*)
  into other_active_admins
  from public.profiles
  where company_id = old.company_id
    and id <> old.id
    and role = 'admin'
    and is_active = true;

  if other_active_admins = 0 then
    raise exception 'La empresa debe conservar al menos un administrador activo.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_active_admin_remains on public.profiles;
create trigger ensure_active_admin_remains
before update or delete on public.profiles
for each row execute function public.ensure_active_admin_remains();

create or replace function public.ticket_status_label(value public.ticket_status)
returns text
language sql
immutable
as $$
  select case value
    when 'pending' then 'Pendiente'
    when 'in_progress' then 'En progreso'
    when 'completed' then 'Completado'
    else value::text
  end;
$$;

create or replace function public.enqueue_ticket_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind text;
  v_title text;
  v_body text;
begin
  if tg_op = 'INSERT' then
    v_kind := 'ticket_created';
    v_title := 'Nuevo ticket';
    v_body := new.title;
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    v_kind := 'ticket_status_changed';
    v_title := 'Ticket actualizado';
    v_body := new.title || ' ahora esta en ' || public.ticket_status_label(new.status) || '.';
  else
    return new;
  end if;

  insert into public.notification_events (
    company_id,
    ticket_id,
    actor_id,
    kind,
    title,
    body,
    payload
  )
  values (
    new.company_id,
    new.id,
    auth.uid(),
    v_kind,
    v_title,
    v_body,
    jsonb_build_object(
      'ticketId', new.id,
      'applicationId', new.application_id,
      'status', new.status,
      'priority', new.priority,
      'title', new.title
    )
  );

  return new;
end;
$$;

drop trigger if exists enqueue_ticket_notification on public.tickets;
create trigger enqueue_ticket_notification
after insert or update of status on public.tickets
for each row execute function public.enqueue_ticket_notification();

create or replace function public.ticket_payload(p_ticket_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  payload jsonb;
begin
  select jsonb_build_object(
    'id', t.id,
    'companyId', t.company_id,
    'applicationId', t.application_id,
    'createdById', t.created_by_id,
    'title', t.title,
    'description', t.description,
    'status', t.status,
    'priority', t.priority,
    'completedAt', t.completed_at,
    'createdAt', t.created_at,
    'updatedAt', t.updated_at,
    'evidences', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id,
        'ticketId', e.ticket_id,
        'companyId', e.company_id,
        'uploadedById', e.uploaded_by_id,
        'fileName', e.file_name,
        'mimeType', e.mime_type,
        'type', e.type,
        'size', e.size,
        'storagePath', e.storage_path,
        'publicUrl', e.public_url,
        'createdAt', e.created_at,
        'updatedAt', e.updated_at
      ) order by e.created_at desc)
      from public.evidences e
      where e.ticket_id = t.id
    ), '[]'::jsonb),
    'comments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id,
        'ticketId', c.ticket_id,
        'authorId', c.author_id,
        'body', c.body,
        'createdAt', c.created_at
      ) order by c.created_at desc)
      from public.ticket_comments c
      where c.ticket_id = t.id
    ), '[]'::jsonb),
    'statusHistory', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id,
        'ticketId', l.ticket_id,
        'fromStatus', l.from_status,
        'toStatus', l.to_status,
        'changedById', l.changed_by_id,
        'note', l.note,
        'createdAt', l.created_at
      ) order by l.created_at desc)
      from public.ticket_status_logs l
      where l.ticket_id = t.id
    ), '[]'::jsonb)
  )
  into payload
  from public.tickets t
  where t.id = p_ticket_id;

  return payload;
end;
$$;

create or replace function public.register_company(
  p_company_name text,
  p_application_name text,
  p_admin_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_company public.companies;
  v_application public.applications;
  v_profile public.profiles;
  v_base_slug text;
  v_slug text;
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesion para registrar una empresa.';
  end if;

  if exists (select 1 from public.profiles where id = v_user_id) then
    raise exception 'Este usuario ya pertenece a una empresa.';
  end if;

  if trim(coalesce(p_company_name, '')) = '' then
    raise exception 'El nombre de la empresa es obligatorio.';
  end if;

  if trim(coalesce(p_admin_name, '')) = '' then
    raise exception 'El nombre del administrador es obligatorio.';
  end if;

  v_base_slug := coalesce(public.slugify(p_company_name), 'empresa');
  v_slug := v_base_slug;

  while exists (select 1 from public.companies where slug = v_slug) loop
    v_slug := v_base_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end loop;

  insert into public.companies (name, slug)
  values (trim(p_company_name), v_slug)
  returning * into v_company;

  insert into public.applications (company_id, name, description)
  values (
    v_company.id,
    coalesce(nullif(trim(p_application_name), ''), 'Aplicacion Principal'),
    ''
  )
  returning * into v_application;

  insert into public.profiles (id, company_id, name, email, role)
  values (v_user_id, v_company.id, trim(p_admin_name), v_email, 'admin')
  returning * into v_profile;

  return jsonb_build_object(
    'company', jsonb_build_object(
      'id', v_company.id,
      'name', v_company.name,
      'slug', v_company.slug,
      'createdAt', v_company.created_at,
      'updatedAt', v_company.updated_at
    ),
    'application', jsonb_build_object(
      'id', v_application.id,
      'companyId', v_application.company_id,
      'name', v_application.name,
      'description', v_application.description,
      'isActive', v_application.is_active,
      'createdAt', v_application.created_at,
      'updatedAt', v_application.updated_at
    ),
    'user', jsonb_build_object(
      'id', v_profile.id,
      'companyId', v_profile.company_id,
      'name', v_profile.name,
      'email', v_profile.email,
      'role', v_profile.role,
      'isActive', v_profile.is_active,
      'createdAt', v_profile.created_at,
      'updatedAt', v_profile.updated_at
    )
  );
end;
$$;

create or replace function public.create_ticket(
  p_application_id uuid,
  p_title text,
  p_description text default '',
  p_priority text default 'medium'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid := public.current_company_id();
  v_priority public.ticket_priority;
  v_ticket public.tickets;
begin
  if not public.can_write_tickets() then
    raise exception 'Solo administradores y desarrolladores pueden modificar tickets.';
  end if;

  if trim(coalesce(p_title, '')) = '' then
    raise exception 'El titulo es obligatorio.';
  end if;

  v_priority := coalesce(nullif(p_priority, ''), 'medium')::public.ticket_priority;

  if not exists (
    select 1
    from public.applications
    where id = p_application_id
      and company_id = v_company_id
      and is_active = true
  ) then
    raise exception 'La aplicacion seleccionada no existe o esta inactiva.';
  end if;

  insert into public.tickets (
    company_id,
    application_id,
    created_by_id,
    title,
    description,
    priority
  )
  values (
    v_company_id,
    p_application_id,
    auth.uid(),
    trim(p_title),
    trim(coalesce(p_description, '')),
    v_priority
  )
  returning * into v_ticket;

  insert into public.ticket_status_logs (
    ticket_id,
    company_id,
    from_status,
    to_status,
    changed_by_id,
    note
  )
  values (
    v_ticket.id,
    v_ticket.company_id,
    null,
    'pending',
    auth.uid(),
    'Ticket creado.'
  );

  return public.ticket_payload(v_ticket.id);
end;
$$;

create or replace function public.change_ticket_status(
  p_ticket_id uuid,
  p_status text,
  p_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid := public.current_company_id();
  v_next_status public.ticket_status;
  v_ticket public.tickets;
  v_previous_status public.ticket_status;
begin
  if not public.can_write_tickets() then
    raise exception 'Solo administradores y desarrolladores pueden modificar tickets.';
  end if;

  v_next_status := coalesce(nullif(p_status, ''), 'pending')::public.ticket_status;

  select *
  into v_ticket
  from public.tickets
  where id = p_ticket_id
    and company_id = v_company_id
  for update;

  if not found then
    raise exception 'El ticket solicitado no existe.';
  end if;

  if v_ticket.status = v_next_status then
    raise exception 'El ticket ya tiene ese estado.';
  end if;

  v_previous_status := v_ticket.status;

  update public.tickets
  set
    status = v_next_status,
    completed_at = case when v_next_status = 'completed' then now() else null end
  where id = v_ticket.id
  returning * into v_ticket;

  insert into public.ticket_status_logs (
    ticket_id,
    company_id,
    from_status,
    to_status,
    changed_by_id,
    note
  )
  values (
    v_ticket.id,
    v_ticket.company_id,
    v_previous_status,
    v_next_status,
    auth.uid(),
    trim(coalesce(p_note, ''))
  );

  return public.ticket_payload(v_ticket.id);
end;
$$;

create or replace function public.add_ticket_comment(
  p_ticket_id uuid,
  p_body text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid := public.current_company_id();
  v_ticket public.tickets;
begin
  if not public.can_write_tickets() then
    raise exception 'Solo administradores y desarrolladores pueden modificar tickets.';
  end if;

  if trim(coalesce(p_body, '')) = '' then
    raise exception 'El comentario es obligatorio.';
  end if;

  select *
  into v_ticket
  from public.tickets
  where id = p_ticket_id
    and company_id = v_company_id;

  if not found then
    raise exception 'El ticket solicitado no existe.';
  end if;

  insert into public.ticket_comments (ticket_id, company_id, author_id, body)
  values (v_ticket.id, v_ticket.company_id, auth.uid(), trim(p_body));

  update public.tickets
  set updated_at = now()
  where id = v_ticket.id;

  return public.ticket_payload(v_ticket.id);
end;
$$;

create or replace function public.add_ticket_evidence(
  p_ticket_id uuid,
  p_file_name text,
  p_mime_type text,
  p_size integer,
  p_storage_path text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid := public.current_company_id();
  v_ticket public.tickets;
  v_type public.evidence_type;
begin
  if not public.can_write_tickets() then
    raise exception 'Solo administradores y desarrolladores pueden modificar tickets.';
  end if;

  if p_mime_type not in (
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) then
    raise exception 'El tipo de archivo no esta permitido.';
  end if;

  if p_size is null or p_size <= 0 or p_size > 10485760 then
    raise exception 'El archivo no tiene un tamano valido.';
  end if;

  select *
  into v_ticket
  from public.tickets
  where id = p_ticket_id
    and company_id = v_company_id;

  if not found then
    raise exception 'El ticket solicitado no existe.';
  end if;

  if split_part(p_storage_path, '/', 1) <> v_ticket.company_id::text then
    raise exception 'La ruta de almacenamiento no pertenece a tu empresa.';
  end if;

  v_type := case when p_mime_type like 'image/%' then 'image' else 'document' end;

  insert into public.evidences (
    ticket_id,
    company_id,
    uploaded_by_id,
    file_name,
    mime_type,
    type,
    size,
    storage_path,
    public_url
  )
  values (
    v_ticket.id,
    v_ticket.company_id,
    auth.uid(),
    trim(p_file_name),
    p_mime_type,
    v_type,
    p_size,
    p_storage_path,
    ''
  );

  update public.tickets
  set updated_at = now()
  where id = v_ticket.id;

  return public.ticket_payload(v_ticket.id);
end;
$$;

create or replace function public.register_push_token(
  p_token text,
  p_platform text default 'unknown'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_company_id uuid := public.current_company_id();
  v_platform text := coalesce(nullif(trim(p_platform), ''), 'unknown');
  v_token public.push_tokens;
begin
  if v_user_id is null or v_company_id is null then
    raise exception 'Debes iniciar sesion para activar notificaciones.';
  end if;

  if trim(coalesce(p_token, '')) = '' then
    raise exception 'El token de notificaciones es obligatorio.';
  end if;

  if v_platform not in ('ios', 'android', 'web', 'unknown') then
    v_platform := 'unknown';
  end if;

  insert into public.push_tokens (
    user_id,
    company_id,
    token,
    platform,
    is_active,
    last_seen_at
  )
  values (
    v_user_id,
    v_company_id,
    trim(p_token),
    v_platform,
    true,
    now()
  )
  on conflict (token) do update
  set
    user_id = excluded.user_id,
    company_id = excluded.company_id,
    platform = excluded.platform,
    is_active = true,
    last_seen_at = now(),
    updated_at = now()
  returning * into v_token;

  return jsonb_build_object(
    'id', v_token.id,
    'userId', v_token.user_id,
    'companyId', v_token.company_id,
    'token', v_token.token,
    'platform', v_token.platform,
    'isActive', v_token.is_active,
    'lastSeenAt', v_token.last_seen_at,
    'createdAt', v_token.created_at,
    'updatedAt', v_token.updated_at
  );
end;
$$;

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_status_logs enable row level security;
alter table public.ticket_comments enable row level security;
alter table public.evidences enable row level security;
alter table public.push_tokens enable row level security;
alter table public.notification_events enable row level security;

drop policy if exists companies_select_company on public.companies;
create policy companies_select_company
on public.companies
for select
to authenticated
using (id = public.current_company_id());

drop policy if exists companies_update_admin on public.companies;
create policy companies_update_admin
on public.companies
for update
to authenticated
using (public.is_admin() and id = public.current_company_id())
with check (public.is_admin() and id = public.current_company_id());

drop policy if exists profiles_select_company on public.profiles;
create policy profiles_select_company
on public.profiles
for select
to authenticated
using (company_id = public.current_company_id());

drop policy if exists profiles_insert_admin on public.profiles;
create policy profiles_insert_admin
on public.profiles
for insert
to authenticated
with check (public.is_admin() and company_id = public.current_company_id());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin
on public.profiles
for update
to authenticated
using (public.is_admin() and company_id = public.current_company_id())
with check (public.is_admin() and company_id = public.current_company_id());

drop policy if exists applications_select_company on public.applications;
create policy applications_select_company
on public.applications
for select
to authenticated
using (company_id = public.current_company_id());

drop policy if exists applications_insert_admin on public.applications;
create policy applications_insert_admin
on public.applications
for insert
to authenticated
with check (public.is_admin() and company_id = public.current_company_id());

drop policy if exists applications_update_admin on public.applications;
create policy applications_update_admin
on public.applications
for update
to authenticated
using (public.is_admin() and company_id = public.current_company_id())
with check (public.is_admin() and company_id = public.current_company_id());

drop policy if exists tickets_select_company on public.tickets;
create policy tickets_select_company
on public.tickets
for select
to authenticated
using (company_id = public.current_company_id());

drop policy if exists tickets_insert_writer on public.tickets;
create policy tickets_insert_writer
on public.tickets
for insert
to authenticated
with check (public.can_write_tickets() and company_id = public.current_company_id());

drop policy if exists tickets_update_writer on public.tickets;
create policy tickets_update_writer
on public.tickets
for update
to authenticated
using (public.can_write_tickets() and company_id = public.current_company_id())
with check (public.can_write_tickets() and company_id = public.current_company_id());

drop policy if exists ticket_status_logs_select_company on public.ticket_status_logs;
create policy ticket_status_logs_select_company
on public.ticket_status_logs
for select
to authenticated
using (company_id = public.current_company_id());

drop policy if exists ticket_comments_select_company on public.ticket_comments;
create policy ticket_comments_select_company
on public.ticket_comments
for select
to authenticated
using (company_id = public.current_company_id());

drop policy if exists ticket_comments_insert_writer on public.ticket_comments;
create policy ticket_comments_insert_writer
on public.ticket_comments
for insert
to authenticated
with check (public.can_write_tickets() and company_id = public.current_company_id());

drop policy if exists evidences_select_company on public.evidences;
create policy evidences_select_company
on public.evidences
for select
to authenticated
using (company_id = public.current_company_id());

drop policy if exists evidences_insert_writer on public.evidences;
create policy evidences_insert_writer
on public.evidences
for insert
to authenticated
with check (public.can_write_tickets() and company_id = public.current_company_id());

drop policy if exists push_tokens_select_own on public.push_tokens;
create policy push_tokens_select_own
on public.push_tokens
for select
to authenticated
using (user_id = auth.uid() and company_id = public.current_company_id());

drop policy if exists push_tokens_update_own on public.push_tokens;
create policy push_tokens_update_own
on public.push_tokens
for update
to authenticated
using (user_id = auth.uid() and company_id = public.current_company_id())
with check (user_id = auth.uid() and company_id = public.current_company_id());

drop policy if exists notification_events_select_admin on public.notification_events;
create policy notification_events_select_admin
on public.notification_events
for select
to authenticated
using (public.is_admin() and company_id = public.current_company_id());

insert into storage.buckets (id, name, public)
values ('evidences', 'evidences', false)
on conflict (id) do update set public = false;

drop policy if exists evidences_storage_select_company on storage.objects;
create policy evidences_storage_select_company
on storage.objects
for select
to authenticated
using (
  bucket_id = 'evidences'
  and (storage.foldername(name))[1]::uuid = public.current_company_id()
);

drop policy if exists evidences_storage_insert_writer on storage.objects;
create policy evidences_storage_insert_writer
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'evidences'
  and public.can_write_tickets()
  and (storage.foldername(name))[1]::uuid = public.current_company_id()
);

drop policy if exists evidences_storage_update_writer on storage.objects;
create policy evidences_storage_update_writer
on storage.objects
for update
to authenticated
using (
  bucket_id = 'evidences'
  and public.can_write_tickets()
  and (storage.foldername(name))[1]::uuid = public.current_company_id()
)
with check (
  bucket_id = 'evidences'
  and public.can_write_tickets()
  and (storage.foldername(name))[1]::uuid = public.current_company_id()
);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.companies to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.applications to authenticated;
grant select, insert, update, delete on public.tickets to authenticated;
grant select, insert, update, delete on public.ticket_status_logs to authenticated;
grant select, insert, update, delete on public.ticket_comments to authenticated;
grant select, insert, update, delete on public.evidences to authenticated;
grant select, insert, update, delete on public.push_tokens to authenticated;
grant select on public.notification_events to authenticated;

revoke execute on function public.ticket_payload(uuid) from public, anon, authenticated;
revoke execute on function public.enqueue_ticket_notification() from public, anon, authenticated;
revoke execute on function public.ensure_active_admin_remains() from public, anon, authenticated;

revoke execute on function public.register_company(text, text, text) from public, anon;
revoke execute on function public.create_ticket(uuid, text, text, text) from public, anon;
revoke execute on function public.change_ticket_status(uuid, text, text) from public, anon;
revoke execute on function public.add_ticket_comment(uuid, text) from public, anon;
revoke execute on function public.add_ticket_evidence(uuid, text, text, integer, text) from public, anon;
revoke execute on function public.register_push_token(text, text) from public, anon;

grant execute on function public.register_company(text, text, text) to authenticated;
grant execute on function public.create_ticket(uuid, text, text, text) to authenticated;
grant execute on function public.change_ticket_status(uuid, text, text) to authenticated;
grant execute on function public.add_ticket_comment(uuid, text) to authenticated;
grant execute on function public.add_ticket_evidence(uuid, text, text, integer, text) to authenticated;
grant execute on function public.register_push_token(text, text) to authenticated;

commit;
