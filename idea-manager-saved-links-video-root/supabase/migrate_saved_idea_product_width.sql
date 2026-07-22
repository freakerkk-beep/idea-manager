-- Add product width field for saved ideas listing AI tools.
-- Run this once in Supabase SQL Editor if your saved_ideas table already exists.

alter table public.saved_ideas
  add column if not exists product_width text;

comment on column public.saved_ideas.product_width is 'Seller-entered product width, e.g. 10 cm / 3.9 in.';
