-- Provisiona o workspace da Vértice e vincula o proprietário.
-- 1. Crie o usuário em Authentication → Users (marque "Auto Confirm User").
-- 2. Troque o e-mail abaixo e execute no SQL Editor do Supabase.
-- O script é transacional e pode ser executado mais de uma vez.
do $$
declare owner uuid := (select id from auth.users where email = 'SEU_EMAIL_AQUI');
begin
  if owner is null then raise exception 'Usuário não encontrado em auth.users'; end if;
  insert into public.workspaces(id,name,created_by)
  values('a1b2c3d4-0000-4000-8000-000000000001','Vértice Agência',owner)
  on conflict(id) do nothing;
  insert into public.workspace_members(workspace_id,user_id,role,created_by)
  values('a1b2c3d4-0000-4000-8000-000000000001',owner,'owner',owner)
  on conflict(workspace_id,user_id) do nothing;
  insert into public.pipeline_stages(workspace_id,name,code,position,created_by)
  select 'a1b2c3d4-0000-4000-8000-000000000001',name,code,position,owner
  from (values ('Novo lead','new',0),('Contato realizado','contact',1),('Reunião agendada','meeting',2),('Diagnóstico','diagnosis',3),('Proposta enviada','proposal',4),('Negociação','negotiation',5),('Fechado','won',6),('Perdido','lost',7)) as s(name,code,position)
  on conflict(workspace_id,code) do nothing;
end $$;
