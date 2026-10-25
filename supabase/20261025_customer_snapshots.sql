-- Tested locally against the exported schema metadata. Apply before the frontend.
-- Existing rows remain unchanged. No policies, grants, or existing functions replaced.
begin;
set local lock_timeout = '3s';
alter table public.customer_leads
  add column snapshot_version integer,
  add column recommended_products jsonb,
  add column selected_products jsonb,
  add column system_snapshot jsonb;
alter table public.customer_quotes
  add column snapshot_version integer,
  add column recommended_products jsonb,
  add column selected_products jsonb,
  add column system_snapshot jsonb;
-- Reuse the existing server-owned profile stamp for leads, too.
create trigger teramatch_stamp_lead_owner_before_insert
before insert on public.customer_leads for each row
execute function public.teramatch_stamp_report_owner();

create function public.teramatch_sync_customer_snapshot()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_lead public.customer_leads%rowtype;
begin
  -- Old clients keep their existing behavior during rollout.
  if new.snapshot_version is distinct from 1 then return new; end if;
  if auth.uid() is null or new.exporter_user_id is distinct from auth.uid() then
    raise exception 'Authenticated owner required' using errcode='42501';
  end if;
  if jsonb_typeof(new.recommended_products) is distinct from 'array'
     or jsonb_typeof(new.selected_products) is distinct from 'array'
     or jsonb_typeof(new.system_snapshot) is distinct from 'object' then
    raise exception 'Invalid customer snapshot' using errcode='22023';
  end if;
  if new.customer_lead_id is null then
    raise exception 'Customer lead required' using errcode='23502';
  end if;
  select * into v_lead from public.customer_leads
    where id = new.customer_lead_id for update;
  if not found or v_lead.exporter_user_id is distinct from auth.uid() then
    raise exception 'Customer lead unavailable' using errcode='42501';
  end if;
  if v_lead.first_name is distinct from new.first_name
    or v_lead.last_name is distinct from new.last_name
    or v_lead.email is distinct from new.email
    or v_lead.phone is distinct from new.phone then
    raise exception 'Customer details changed; submit customer form again' using errcode='22023';
  end if;
  update public.customer_leads set
    exporter_user_id = new.exporter_user_id,
    exporter_full_name = new.exporter_full_name,
    exporter_email = new.exporter_email,
    exporter_phone = new.exporter_phone,
    exporter_business = new.exporter_business,
    snapshot_version = 1,
    recommended_products = new.recommended_products,
    selected_products = new.selected_products,
    system_snapshot = new.system_snapshot
  where id = new.customer_lead_id;
  return new;
end;
$$;
revoke all on function public.teramatch_sync_customer_snapshot() from public, anon, authenticated;
-- z-prefix runs after the two existing quote owner stamps (alphabetical order).
create trigger z_teramatch_sync_customer_snapshot
before insert on public.customer_quotes for each row
execute function public.teramatch_sync_customer_snapshot();
-- The current database grants no INSERT on customer_leads to authenticated.
-- A narrow RPC writes only the authenticated caller's validated snapshot.
create function public.teramatch_save_customer_lead(p_id uuid, p_customer jsonb, p_snapshot jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_existing public.customer_leads%rowtype;
begin
  if auth.uid() is null or p_id is null then
    raise exception 'Authentication and request ID required' using errcode='42501';
  end if;
  if jsonb_typeof(p_snapshot->'recommended_products') is distinct from 'array'
     or jsonb_typeof(p_snapshot->'system_snapshot') is distinct from 'object' then
    raise exception 'Invalid snapshot' using errcode='22023';
  end if;
  insert into public.customer_leads(id,first_name,last_name,email,phone,
    snapshot_version,recommended_products,selected_products,system_snapshot)
  values(p_id,p_customer->>'firstName',p_customer->>'lastName',
    p_customer->>'email',p_customer->>'phone',1,
    p_snapshot->'recommended_products','[]',p_snapshot->'system_snapshot')
  on conflict(id) do nothing;
  select * into v_existing from public.customer_leads where id=p_id;
  if v_existing.exporter_user_id is distinct from auth.uid()
     or v_existing.first_name is distinct from p_customer->>'firstName'
     or v_existing.last_name is distinct from p_customer->>'lastName'
     or v_existing.email is distinct from p_customer->>'email'
     or v_existing.phone is distinct from p_customer->>'phone' then
    raise exception 'Request ID unavailable' using errcode='42501';
  end if;
  return p_id;
end;
$$;
revoke all on function public.teramatch_save_customer_lead(uuid,jsonb,jsonb) from public, anon;
grant execute on function public.teramatch_save_customer_lead(uuid,jsonb,jsonb) to authenticated;
commit;
