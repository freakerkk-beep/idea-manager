-- Add Amazon listing helper fields to saved_ideas.
-- Safe to run multiple times. Does not delete existing data.
alter table public.saved_ideas
  add column if not exists product_image_url text,
  add column if not exists product_height text,
  add column if not exists product_weight text;

comment on column public.saved_ideas.product_image_url is 'Reference image or mockup URL for Amazon listing AI prompt.';
comment on column public.saved_ideas.product_height is 'Seller-entered product height, e.g. 12 cm / 4.7 in.';
comment on column public.saved_ideas.product_weight is 'Seller-entered finished product weight, e.g. 85 g / 3 oz.';
