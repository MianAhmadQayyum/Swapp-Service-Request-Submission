-- ============================================================
-- Canonical issue_types catalog + SLA hours (from product CSV).
-- Upserts by title; removes rows not in catalog only when no tickets reference them.
-- ============================================================

insert into public.issue_types (title, sla_resolution_hours_limit)
values
  -- Handovers
  ('Handovers - Features Missing', 24),
  ('Handovers - Original Car Not Available', 24),
  ('Handovers - Poor Car Condition', 6),
  ('Handovers - Supplier Delay', 0.5),
  ('Handovers - Rude Behaviour/Service Failure', 0.5),
  ('Handovers - Requesting upgrade', 36),
  -- Service Requests & Replacements
  ('Service Requests & Replacements-Vehicle Condition & Hygiene', 24),
  ('Service Requests & Replacements-Battery & Starting Issues', 1),
  ('Service Requests & Replacements-Scheduled Service & Maintenance', 48),
  ('Service Requests & Replacements-Accident', 1.5),
  ('Service Requests & Replacements-Brakes & Safety Mechanical', 6),
  ('Service Requests & Replacements-Air Conditioning Failure', 12),
  ('Service Requests & Replacements-Infotainment & Connectivity', 24),
  ('Service Requests & Replacements-Tyre Wear & Sensor Issues', 1),
  ('Service Requests & Replacements-Lights & Electrical Faults', 6),
  ('Service Requests & Replacements-Lost & Found / Keys', 6),
  ('Service Requests & Replacements-Tyre Emergency', 1),
  ('Service Requests & Replacements-Breakdown & Engine Failure', 1),
  ('Service Requests & Replacements - Swapping', 36),
  ('Service Requests & Replacements - Delay in Providing Original Car', 6),
  ('Service Requests & Replacements - Poor Handling(Driver, Care)', 0.5),
  ('Service Requests & Replacements - Delay in replacement', 6),
  ('Service Requests & Replacements - Faulty Replacement', 1),
  ('Service Requests & Replacements - Damage Charges', 3),
  -- Payments
  ('Payments - Rental Fee', 3),
  ('Payments - Damages', 3),
  ('Payments - Extra Miles', 3),
  ('Payments - Fuel', 3),
  ('Payments - Cleaning Charges', 3),
  ('Payments - Parking', 3),
  ('Payments - Discount Coupon', 3),
  ('Payments-Fines', 3),
  ('Payments - Saliks', 3),
  ('Payments-Spare Key Charges', 3),
  ('Payments-Handling Fee', 3),
  ('Payments-Penalty Fee', 3),
  ('Payments-Duplicate Charge', 3),
  ('Payments-Deposit Refund', 3),
  ('Payments-Refund Unused Days', 3),
  ('Payments-Secondary Driver Fee', 3),
  -- Handbacks
  ('Handbacks - Supplier Delay', 0.5),
  ('Handbacks - Rude Behaviour/Service Failure', 0.5),
  ('Handbacks -Unused days refund', 3),
  ('Handbacks- Return Status not updated', 2),
  -- KYC & Pre-Booking
  ('KYC & Pre-Booking - Delayed Approval', 1),
  ('KYC & Pre-Booking - Booking Rejected', 1),
  ('KYC & Pre-Booking - Availability of car', 1),
  ('KYC & Pre-Booking - Confirmation on features & Specs', 1),
  ('KYC & Pre-Booking - Poor Communication', 1),
  -- Care Handling
  ('Care Handling - Incorrect Information', 1),
  ('Care Handling - Lack of Empathy', 1),
  ('Care Handling - Excessive Interactions', 1),
  ('Care Handling - Internal Mistake', 1),
  -- Other
  ('Other', 2)
on conflict (title) do update
set sla_resolution_hours_limit = excluded.sla_resolution_hours_limit;

-- Drop legacy issue types not in the catalog above, only if no ticket references them.
with catalog(title) as (
  values
    ('Handovers - Features Missing'),
    ('Handovers - Original Car Not Available'),
    ('Handovers - Poor Car Condition'),
    ('Handovers - Supplier Delay'),
    ('Handovers - Rude Behaviour/Service Failure'),
    ('Handovers - Requesting upgrade'),
    ('Service Requests & Replacements-Vehicle Condition & Hygiene'),
    ('Service Requests & Replacements-Battery & Starting Issues'),
    ('Service Requests & Replacements-Scheduled Service & Maintenance'),
    ('Service Requests & Replacements-Accident'),
    ('Service Requests & Replacements-Brakes & Safety Mechanical'),
    ('Service Requests & Replacements-Air Conditioning Failure'),
    ('Service Requests & Replacements-Infotainment & Connectivity'),
    ('Service Requests & Replacements-Tyre Wear & Sensor Issues'),
    ('Service Requests & Replacements-Lights & Electrical Faults'),
    ('Service Requests & Replacements-Lost & Found / Keys'),
    ('Service Requests & Replacements-Tyre Emergency'),
    ('Service Requests & Replacements-Breakdown & Engine Failure'),
    ('Service Requests & Replacements - Swapping'),
    ('Service Requests & Replacements - Delay in Providing Original Car'),
    ('Service Requests & Replacements - Poor Handling(Driver, Care)'),
    ('Service Requests & Replacements - Delay in replacement'),
    ('Service Requests & Replacements - Faulty Replacement'),
    ('Service Requests & Replacements - Damage Charges'),
    ('Payments - Rental Fee'),
    ('Payments - Damages'),
    ('Payments - Extra Miles'),
    ('Payments - Fuel'),
    ('Payments - Cleaning Charges'),
    ('Payments - Parking'),
    ('Payments - Discount Coupon'),
    ('Payments-Fines'),
    ('Payments - Saliks'),
    ('Payments-Spare Key Charges'),
    ('Payments-Handling Fee'),
    ('Payments-Penalty Fee'),
    ('Payments-Duplicate Charge'),
    ('Payments-Deposit Refund'),
    ('Payments-Refund Unused Days'),
    ('Payments-Secondary Driver Fee'),
    ('Handbacks - Supplier Delay'),
    ('Handbacks - Rude Behaviour/Service Failure'),
    ('Handbacks -Unused days refund'),
    ('Handbacks- Return Status not updated'),
    ('KYC & Pre-Booking - Delayed Approval'),
    ('KYC & Pre-Booking - Booking Rejected'),
    ('KYC & Pre-Booking - Availability of car'),
    ('KYC & Pre-Booking - Confirmation on features & Specs'),
    ('KYC & Pre-Booking - Poor Communication'),
    ('Care Handling - Incorrect Information'),
    ('Care Handling - Lack of Empathy'),
    ('Care Handling - Excessive Interactions'),
    ('Care Handling - Internal Mistake'),
    ('Other')
)
delete from public.issue_types it
where not exists (select 1 from catalog c where c.title = it.title)
  and not exists (select 1 from public.tickets t where t.issue_category_id = it.id);
