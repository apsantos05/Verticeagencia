-- Phase 1: identity, tenant isolation and the minimum operational read model.
begin;
create type public.app_role as enum ('owner','admin','gestor','social_media','designer','editor','financeiro');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (length(full_name) <= 120),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  timezone text not null default 'America/Sao_Paulo' check (timezone = 'America/Sao_Paulo'),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null default 'social_media',
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_idx on public.workspace_members(user_id) where active;

-- Fixed search_path, no user-supplied identity and no recursive RLS evaluation.
create function public.workspace_role(target uuid) returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.workspace_members
  where workspace_id = target and user_id = (select auth.uid()) and active;
$$;
revoke all on function public.workspace_role(uuid) from public, anon;
grant execute on function public.workspace_role(uuid) to authenticated;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name',''),120));
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
insert into public.profiles(id, full_name) select id, left(coalesce(raw_user_meta_data->>'full_name',''),120) from auth.users on conflict do nothing;

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  name text not null check (length(trim(name)) between 1 and 160),
  company text,
  status text not null default 'onboarding' check (status in ('active','onboarding','paused','cancelled')),
  responsible_id uuid,
  created_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_id,id),
  foreign key(workspace_id,responsible_id) references public.workspace_members(workspace_id,user_id)
);
create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  name text not null, code text not null, position integer not null,
  created_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_id,id), unique(workspace_id,code), unique(workspace_id,position)
);
create table public.leads (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  name text not null check(length(trim(name)) between 1 and 160),
  company text, stage_id uuid not null, responsible_id uuid,
  estimated_amount numeric(14,2) not null default 0 check(estimated_amount >= 0),
  follow_up_at timestamptz,
  created_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_id,id),
  foreign key(workspace_id,stage_id) references public.pipeline_stages(workspace_id,id),
  foreign key(workspace_id,responsible_id) references public.workspace_members(workspace_id,user_id)
);
create table public.projects (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  client_id uuid, title text not null check(length(trim(title)) between 1 and 200),
  type text not null default 'social_media' check(type in ('social_media','website','landing_page','campaign','branding','ads','other')),
  status text not null default 'active' check(status in ('active','paused','completed','cancelled')),
  responsible_id uuid, due_at timestamptz,
  created_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_id,id),
  foreign key(workspace_id,client_id) references public.clients(workspace_id,id),
  foreign key(workspace_id,responsible_id) references public.workspace_members(workspace_id,user_id)
);
create table public.content_items (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  client_id uuid not null, title text not null check(length(trim(title)) between 1 and 200),
  format text not null default 'post' check(format in ('reel','post','carousel','story','tiktok','shorts','other')),
  status text not null default 'idea' check(status in ('idea','briefing','copy','production','internal_review','awaiting_client','changes','approved','scheduled','published','cancelled')),
  scheduled_at timestamptz, responsible_id uuid, designer_id uuid, editor_id uuid,
  created_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_id,id),
  foreign key(workspace_id,client_id) references public.clients(workspace_id,id),
  foreign key(workspace_id,responsible_id) references public.workspace_members(workspace_id,user_id),
  foreign key(workspace_id,designer_id) references public.workspace_members(workspace_id,user_id),
  foreign key(workspace_id,editor_id) references public.workspace_members(workspace_id,user_id)
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  client_id uuid, project_id uuid, content_id uuid,
  title text not null check(length(trim(title)) between 1 and 200),
  status text not null default 'todo' check(status in ('todo','in_progress','review','blocked','completed')),
  priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),
  responsible_id uuid, due_at timestamptz,
  created_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_id,id),
  foreign key(workspace_id,client_id) references public.clients(workspace_id,id),
  foreign key(workspace_id,project_id) references public.projects(workspace_id,id),
  foreign key(workspace_id,content_id) references public.content_items(workspace_id,id),
  foreign key(workspace_id,responsible_id) references public.workspace_members(workspace_id,user_id)
);
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  client_id uuid, title text not null check(length(trim(title)) between 1 and 200),
  type text not null default 'meeting' check(type in ('meeting','recording','photos','delivery','content','due','billing','report','task','other')),
  starts_at timestamptz not null, ends_at timestamptz not null, responsible_id uuid,
  created_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(ends_at > starts_at), unique(workspace_id,id),
  foreign key(workspace_id,client_id) references public.clients(workspace_id,id),
  foreign key(workspace_id,responsible_id) references public.workspace_members(workspace_id,user_id)
);
-- Accrual records are distinct from cash movements. Monetary values never use floats.
create table public.receivables (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  client_id uuid, description text not null, competence date not null, due_date date not null,
  amount numeric(14,2) not null check(amount > 0), cancelled boolean not null default false,
  recurrence_key text,
  created_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_id,id), unique(workspace_id,recurrence_key),
  foreign key(workspace_id,client_id) references public.clients(workspace_id,id)
);
create table public.payables (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  description text not null, supplier text, category text not null default 'Outros',
  competence date not null, due_date date not null,
  amount numeric(14,2) not null check(amount > 0), cancelled boolean not null default false,
  recurrence_key text,
  created_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_id,id), unique(workspace_id,recurrence_key)
);
create table public.receipts (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  receivable_id uuid not null, amount numeric(14,2) not null check(amount > 0), paid_on date not null,
  method text not null check(method in ('pix','transfer','bank_slip','card','cash','other')),
  idempotency_key uuid not null unique,
  created_by uuid default auth.uid() references public.profiles(id), created_at timestamptz not null default now(),
  foreign key(workspace_id,receivable_id) references public.receivables(workspace_id,id)
);
create table public.disbursements (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  payable_id uuid not null, amount numeric(14,2) not null check(amount > 0), paid_on date not null,
  method text not null check(method in ('pix','transfer','bank_slip','card','cash','other')),
  idempotency_key uuid not null unique,
  created_by uuid default auth.uid() references public.profiles(id), created_at timestamptz not null default now(),
  foreign key(workspace_id,payable_id) references public.payables(workspace_id,id)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  user_id uuid not null, title text not null, body text not null default '', read_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key(workspace_id,user_id) references public.workspace_members(workspace_id,user_id)
);
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  actor_id uuid references public.profiles(id), entity text not null, entity_id uuid not null,
  action text not null, created_at timestamptz not null default now()
);

create function public.stamp_record() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.workspace_id <> old.workspace_id then raise exception 'Workspace is immutable'; end if;
    new.created_by := old.created_by; new.created_at := old.created_at;
  elsif auth.uid() is not null then new.created_by := auth.uid();
  end if;
  new.updated_at := now(); return new;
end; $$;
create function public.audit_record() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.activity_logs(workspace_id,actor_id,entity,entity_id,action)
  values(new.workspace_id,auth.uid(),tg_table_name,new.id,lower(tg_op));
  return new;
end; $$;
revoke all on function public.audit_record() from public;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
-- Supabase projects can grant CRUD by default. Remove inherited grants explicitly.
do $$ declare t text; begin
  foreach t in array array['profiles','workspaces','workspace_members','clients','pipeline_stages','leads','projects','content_items','tasks','calendar_events','receivables','payables','receipts','disbursements','notifications','activity_logs'] loop
    execute format('revoke all on public.%I from anon, authenticated',t);
  end loop;
end $$;
create policy profiles_self on public.profiles for select to authenticated using(id = (select auth.uid()));
create policy workspace_read on public.workspaces for select to authenticated using(public.workspace_role(id) is not null);
create policy members_read on public.workspace_members for select to authenticated
using(user_id = (select auth.uid()) or public.workspace_role(workspace_id) in ('owner','admin'));
-- Membership and role changes are provisioning-only until the administration module is audited.
grant select on public.profiles, public.workspaces, public.workspace_members to authenticated;

do $$
declare t text; access_rule text;
begin
  foreach t in array array['clients','pipeline_stages','leads','projects','content_items','tasks','calendar_events','receivables','payables'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create index %I on public.%I(workspace_id)',t || '_workspace_idx',t);
    execute format('create trigger stamp before insert or update on public.%I for each row execute function public.stamp_record()',t);
    execute format('create trigger audit after insert or update on public.%I for each row execute function public.audit_record()',t);
    if t in ('receivables','payables') then
      access_rule := 'public.workspace_role(workspace_id) in (''owner'',''admin'',''financeiro'')';
    else
      access_rule := 'public.workspace_role(workspace_id) in (''owner'',''admin'',''gestor'')';
    end if;
    execute format('create policy manager_read on public.%I for select to authenticated using (%s)',t,access_rule);
    execute format('create policy manager_insert on public.%I for insert to authenticated with check (%s)',t,access_rule);
    execute format('create policy manager_update on public.%I for update to authenticated using (%s) with check (%s)',t,access_rule,access_rule);
    execute format('grant select, insert, update on public.%I to authenticated',t);
  end loop;
end $$;
create policy assigned_clients on public.clients for select to authenticated
using(public.workspace_role(workspace_id) = 'social_media' and responsible_id = (select auth.uid()));
create policy assigned_content on public.content_items for select to authenticated using(
  (public.workspace_role(workspace_id) = 'social_media' and responsible_id = (select auth.uid())) or
  (public.workspace_role(workspace_id) = 'designer' and designer_id = (select auth.uid())) or
  (public.workspace_role(workspace_id) = 'editor' and editor_id = (select auth.uid()))
);
create policy assigned_tasks on public.tasks for select to authenticated
using(public.workspace_role(workspace_id) in ('social_media','designer','editor') and responsible_id = (select auth.uid()));
create policy assigned_events on public.calendar_events for select to authenticated
using(public.workspace_role(workspace_id) is not null and responsible_id = (select auth.uid()));

-- Cash entries are append-only; serialized against their invoice to prevent overpayment.
create function public.validate_cash_entry() returns trigger language plpgsql set search_path = '' as $$
declare total numeric; settled numeric; is_cancelled boolean;
begin
  if tg_table_name = 'receipts' then
    select amount,cancelled into total,is_cancelled from public.receivables where workspace_id=new.workspace_id and id=new.receivable_id for update;
    select coalesce(sum(amount),0) into settled from public.receipts where workspace_id=new.workspace_id and receivable_id=new.receivable_id;
  else
    select amount,cancelled into total,is_cancelled from public.payables where workspace_id=new.workspace_id and id=new.payable_id for update;
    select coalesce(sum(amount),0) into settled from public.disbursements where workspace_id=new.workspace_id and payable_id=new.payable_id;
  end if;
  if total is null or is_cancelled or settled + new.amount > total then raise exception 'Invalid settlement amount or account'; end if;
  new.created_by := auth.uid(); return new;
end; $$;
create function public.protect_settled_account() returns trigger language plpgsql set search_path = '' as $$
declare settled numeric;
begin
  if tg_table_name = 'receivables' then
    select coalesce(sum(amount),0) into settled from public.receipts where workspace_id=old.workspace_id and receivable_id=old.id;
  else
    select coalesce(sum(amount),0) into settled from public.disbursements where workspace_id=old.workspace_id and payable_id=old.id;
  end if;
  if new.amount < settled or (new.cancelled and settled > 0) then raise exception 'Account has settlements'; end if;
  return new;
end; $$;
create trigger protect_settlement before update on public.receivables for each row execute function public.protect_settled_account();
create trigger protect_settlement before update on public.payables for each row execute function public.protect_settled_account();
do $$ declare t text; begin
  foreach t in array array['receipts','disbursements'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create index %I on public.%I(workspace_id,paid_on)',t || '_date_idx',t);
    execute format('create policy finance_read on public.%I for select to authenticated using(public.workspace_role(workspace_id) in (''owner'',''admin'',''financeiro''))',t);
    execute format('create policy finance_insert on public.%I for insert to authenticated with check(public.workspace_role(workspace_id) in (''owner'',''admin'',''financeiro''))',t);
    execute format('create trigger validate_cash before insert on public.%I for each row execute function public.validate_cash_entry()',t);
    execute format('create trigger audit after insert on public.%I for each row execute function public.audit_record()',t);
    execute format('grant select, insert on public.%I to authenticated',t);
  end loop;
end $$;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;
create policy notifications_self on public.notifications for select to authenticated
using(user_id = (select auth.uid()) and public.workspace_role(workspace_id) is not null);
create policy audit_admin on public.activity_logs for select to authenticated using(public.workspace_role(workspace_id) in ('owner','admin'));
grant select on public.notifications,public.activity_logs to authenticated;
create index notifications_user_idx on public.notifications(workspace_id,user_id,created_at desc);
create index audit_workspace_idx on public.activity_logs(workspace_id,created_at desc);
create index tasks_due_idx on public.tasks(workspace_id,due_at) where status <> 'completed';
create index content_schedule_idx on public.content_items(workspace_id,scheduled_at);
create index events_starts_idx on public.calendar_events(workspace_id,starts_at);
create index receivables_due_idx on public.receivables(workspace_id,due_date);
create index payables_due_idx on public.payables(workspace_id,due_date);
create index receipts_account_idx on public.receipts(workspace_id,receivable_id);
create index disbursements_account_idx on public.disbursements(workspace_id,payable_id);

-- Private bucket, intentionally no object policies until entity-aware file access ships.
insert into storage.buckets(id,name,public,file_size_limit)
values('workspace-files','workspace-files',false,52428800) on conflict(id) do nothing;
commit;
