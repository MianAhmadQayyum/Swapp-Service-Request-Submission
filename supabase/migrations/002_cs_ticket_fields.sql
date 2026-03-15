-- CS Agent new ticket form: add columns and seed dropdown options

-- Allow tickets without customer name (CS form only has 7 fields)
alter table public.tickets
  alter column customer_name drop not null;

-- New columns for CS ticket form
alter table public.tickets
  add column if not exists cs_agent text,
  add column if not exists escalation_status text,
  add column if not exists service_request_opened text;

-- Seed suppliers (CS form dropdown)
insert into public.suppliers (name) values
  ('Thrifty DXB'),
  ('Dollar DXB'),
  ('Shift DXB'),
  ('Legend world Rent A Car (DXB)'),
  ('Diamondlease'),
  ('Swapp - Diamondlease'),
  ('Swapp - Morning Star'),
  ('Swapp - Avis'),
  ('Swapp - Paramount'),
  ('Swapp - Hertz'),
  ('Swapp - Legend'),
  ('Swapp - Yaseer'),
  ('Swapp - Ok Mobility'),
  ('Thrifty AUH'),
  ('Dollar AUH'),
  ('Legend world Rent A Car (AUH)'),
  ('Automates Auto Rentals LLC'),
  ('Swapp-Shift'),
  ('Paramount'),
  ('Others'),
  ('Thrifty Al Ain')
on conflict (name) do nothing;

-- Seed issue types / Issue Categories (CS form dropdown)
insert into public.issue_types (name) values
  ('Handovers - Features Missing'),
  ('Handovers - Car Not Available'),
  ('Handovers - Poor Car Condition'),
  ('Handovers - Supplier Delay'),
  ('Handovers - Rude Behaviour'),
  ('Service Requests & Replacements - Delay'),
  ('Service Requests & Replacements - Poor Handling(Driver, Care)'),
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
  ('Handbacks - Supplier Delay'),
  ('Handbacks - Rude Behaviour'),
  ('KYC & Pre-Booking - Delayed Approval'),
  ('KYC & Pre-Booking - Booking Rejected'),
  ('KYC & Pre-Booking - Poor Communication'),
  ('Care Handling - Incorrect Information'),
  ('Care Handling - Lack of Empathy'),
  ('Care Handling - Excessive Interactions'),
  ('Care Handling - Internal Mistake'),
  ('Other')
on conflict (name) do nothing;
