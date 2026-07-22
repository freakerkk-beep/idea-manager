alter table public.saved_ideas
  add column if not exists saved_product_url text,
  add column if not exists video_url text;

comment on column public.saved_ideas.saved_product_url is 'Saved product/listing link for the saved idea, e.g. Shopify/Amazon/store URL.';
comment on column public.saved_ideas.video_url is 'Video link for the saved idea, e.g. TikTok/Reels/Drive URL.';

-- One-time helper: if the old Target Customer column was being used to store a URL,
-- copy that URL into the new Saved Product Link column without removing old data.
update public.saved_ideas
set saved_product_url = target_customer
where (saved_product_url is null or btrim(saved_product_url) = '')
  and target_customer ~* '^https?://';
