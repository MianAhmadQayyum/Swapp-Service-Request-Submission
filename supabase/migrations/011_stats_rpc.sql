-- ============================================================
-- Migration 011: get_ticket_stats RPC
--
-- Returns aggregate ticket stats as JSONB.
-- Accepts an optional p_team_id to scope stats to a single team.
-- Uses security invoker so RLS is applied for the calling user.
-- ============================================================

create or replace function public.get_ticket_stats(p_team_id uuid default null)
returns jsonb
language sql
security invoker
set search_path = public
as $$
  with
  counts as (
    select
      count(*)                                                                     as total,
      count(*) filter (where t.status = 'in_progress')                            as in_progress,
      count(*) filter (where t.status = 'waiting_for_supplier')                   as waiting_for_supplier,
      count(*) filter (where t.status = 'waiting_for_customer')                   as waiting_for_customer,
      count(*) filter (where t.status = 'resolved')                               as resolved,
      count(*) filter (
        where it.sla_resolution_hours_limit is not null
      )                                                                            as tickets_with_sla,
      count(*) filter (
        where t.status = 'resolved'
          and t.resolved_at is not null
          and it.sla_resolution_hours_limit is not null
          and extract(epoch from (t.resolved_at - t.created_at)) / 3600.0
              <= it.sla_resolution_hours_limit
      )                                                                            as within_sla,
      count(*) filter (
        where it.sla_resolution_hours_limit is not null
          and extract(epoch from (coalesce(t.resolved_at, now()) - t.created_at)) / 3600.0
              > it.sla_resolution_hours_limit
      )                                                                            as breached_sla,
      count(*) filter (
        where it.sla_resolution_hours_limit is not null
          and t.status != 'resolved'
          and extract(epoch from (now() - t.created_at)) / 3600.0
              > it.sla_resolution_hours_limit
      )                                                                            as breached_unresolved,
      round(
        avg(
          extract(epoch from (t.resolved_at - t.created_at)) / 3600.0
        ) filter (where t.status = 'resolved' and t.resolved_at is not null)::numeric,
        1
      )                                                                            as avg_resolution_hours
    from public.tickets t
    left join public.issue_types it on it.id = t.issue_category_id
    where (p_team_id is null or t.assignee_team_id = p_team_id)
  ),
  by_supplier as (
    select coalesce(jsonb_object_agg(title, cnt), '{}'::jsonb) as data
    from (
      select coalesce(sup.title, 'Unknown') as title, count(*) as cnt
      from public.tickets t
      left join public.suppliers sup on sup.id = t.supplier_id
      where (p_team_id is null or t.assignee_team_id = p_team_id)
      group by 1
    ) s
  ),
  by_issue as (
    select coalesce(jsonb_object_agg(title, cnt), '{}'::jsonb) as data
    from (
      select coalesce(it2.title, 'Unknown') as title, count(*) as cnt
      from public.tickets t
      left join public.issue_types it2 on it2.id = t.issue_category_id
      where (p_team_id is null or t.assignee_team_id = p_team_id)
      group by 1
    ) s
  )
  select jsonb_build_object(
    'total',                c.total,
    'in_progress',          c.in_progress,
    'waiting_for_supplier', c.waiting_for_supplier,
    'waiting_for_customer', c.waiting_for_customer,
    'resolved',             c.resolved,
    'tickets_with_sla',     c.tickets_with_sla,
    'within_sla',           c.within_sla,
    'breached_sla',         c.breached_sla,
    'breached_unresolved',  c.breached_unresolved,
    'avg_resolution_hours', c.avg_resolution_hours,
    'by_supplier',          bs.data,
    'by_issue_type',        bi.data
  )
  from counts c, by_supplier bs, by_issue bi
$$;
