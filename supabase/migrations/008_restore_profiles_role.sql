-- Restore role column on public.profiles (in case it was dropped).
-- Works for both three-role enum (admin, manager, agents) and four-role enum (customer_support, operations, operations_manager, admin).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'user_role' AND e.enumlabel = 'agents'
    ) THEN
      ALTER TABLE public.profiles
        ADD COLUMN role public.user_role NOT NULL DEFAULT 'agents';
    ELSE
      ALTER TABLE public.profiles
        ADD COLUMN role public.user_role NOT NULL DEFAULT 'customer_support';
    END IF;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
