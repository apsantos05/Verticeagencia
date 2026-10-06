begin;
-- SECURITY INVOKER is intentional: aggregates and lists obey each viewer's RLS.
create function public.dashboard_summary(target uuid) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  month_start date := date_trunc('month',now() at time zone 'America/Sao_Paulo')::date;
  month_end date := (date_trunc('month',now() at time zone 'America/Sao_Paulo') + interval '1 month')::date;
  viewer public.app_role := public.workspace_role(target);
  financial jsonb := null;
begin
  if viewer is null then raise exception 'Access denied' using errcode = '42501'; end if;
  if viewer in ('owner','admin','financeiro') then
    with balances as (
      select r.*, r.amount - coalesce((select sum(amount) from public.receipts p where p.workspace_id=target and p.receivable_id=r.id),0) as balance
      from public.receivables r where r.workspace_id=target and not r.cancelled
    ), totals as (
      select coalesce(sum(amount) filter(where competence >= month_start and competence < month_end),0) as expected,
      coalesce(sum(balance),0) as outstanding,
      coalesce(sum(balance) filter(where due_date < today),0) as overdue from balances
    )
    select jsonb_build_object('expected',expected,'outstanding',outstanding,'overdue',overdue,
      'received',coalesce((select sum(amount) from public.receipts where workspace_id=target and paid_on >= month_start and paid_on < month_end),0),
      'expenses',coalesce((select sum(amount) from public.payables where workspace_id=target and not cancelled and competence >= month_start and competence < month_end),0),
      'paid',coalesce((select sum(amount) from public.disbursements where workspace_id=target and paid_on >= month_start and paid_on < month_end),0)
    ) into financial from totals;
  end if;
  return jsonb_build_object(
    'finance',financial,
    'operations',jsonb_build_object(
      'clients',(select count(*) from public.clients where workspace_id=target and status='active'),
      'content',(select count(*) from public.content_items where workspace_id=target and status not in ('cancelled','published') and scheduled_at >= month_start::timestamp at time zone 'America/Sao_Paulo' and scheduled_at < month_end::timestamp at time zone 'America/Sao_Paulo'),
      'approvals',(select count(*) from public.content_items where workspace_id=target and status='awaiting_client'),
      'lateContent',(select count(*) from public.content_items where workspace_id=target and scheduled_at < now() and status not in ('published','cancelled')),
      'tasks',(select count(*) from public.tasks where workspace_id=target and status <> 'completed'),
      'projects',(select count(*) from public.projects where workspace_id=target and status='active'),
      'websites',(select count(*) from public.projects where workspace_id=target and status='active' and type in ('website','landing_page'))
    ),
    'commercial',case when viewer in ('owner','admin','gestor') then (
      select jsonb_build_object(
        'newLeads',count(*) filter(where s.code='new'),
        'meetings',count(*) filter(where s.code='meeting'),
        'proposals',count(*) filter(where s.code='proposal'),
        'negotiations',count(*) filter(where s.code='negotiation'),
        'won',count(*) filter(where s.code='won'),
        'pipeline',coalesce(sum(l.estimated_amount) filter(where s.code not in ('won','lost')),0)
      ) from public.leads l join public.pipeline_stages s on s.workspace_id=l.workspace_id and s.id=l.stage_id where l.workspace_id=target
    ) else null end,
    'agenda',coalesce((select jsonb_agg(row_to_json(e)) from (
      select id,title,starts_at from public.calendar_events where workspace_id=target and ends_at > now() order by starts_at limit 6
    ) e),'[]'::jsonb),
    'lateTasks',coalesce((select jsonb_agg(row_to_json(t)) from (
      select id,title,due_at from public.tasks where workspace_id=target and due_at < now() and status <> 'completed' order by due_at limit 6
    ) t),'[]'::jsonb),
    'deliveries',coalesce((select jsonb_agg(row_to_json(p)) from (
      select id,title,due_at from public.projects where workspace_id=target and status='active' and due_at is not null order by due_at limit 6
    ) p),'[]'::jsonb),
    'approvals',coalesce((select jsonb_agg(row_to_json(c)) from (
      select id,title,scheduled_at from public.content_items where workspace_id=target and status='awaiting_client' order by scheduled_at nulls last limit 6
    ) c),'[]'::jsonb),
    'dueAccounts',coalesce((select jsonb_agg(row_to_json(r)) from (
      select r.id,r.description as title,r.due_date,r.amount-coalesce((select sum(amount) from public.receipts where receivable_id=r.id and workspace_id=target),0) as balance
      from public.receivables r where r.workspace_id=target and not r.cancelled
      and r.amount > coalesce((select sum(amount) from public.receipts where receivable_id=r.id and workspace_id=target),0)
      order by r.due_date limit 6
    ) r),'[]'::jsonb)
  );
end; $$;
revoke all on function public.dashboard_summary(uuid) from public,anon;
grant execute on function public.dashboard_summary(uuid) to authenticated;
commit;
