-- Odometer reading when service request is opened

alter table public.tickets
  add column if not exists odometer_reading text;
