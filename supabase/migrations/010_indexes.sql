-- ============================================================
-- Migration 010: Performance indexes
-- ============================================================

-- Unindexed filter column used by every customer_support list query
create index if not exists idx_tickets_created_by
  on public.tickets(created_by);

-- Unindexed filter column used by supplier filter
create index if not exists idx_tickets_supplier_id
  on public.tickets(supplier_id)
  where supplier_id is not null;

-- Composite index for the most common customer_support query:
--   WHERE created_by = $1 ORDER BY created_at DESC
create index if not exists idx_tickets_created_by_created_at
  on public.tickets(created_by, created_at desc);
