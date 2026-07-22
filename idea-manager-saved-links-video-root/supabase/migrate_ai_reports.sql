-- Thêm hệ thống lưu AI Report cho Idea Manager.
-- Chạy file này 1 lần trong Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.idea_ai_reports (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid null,
  saved_idea_id uuid null,
  source_type text not null default 'idea' check (source_type in ('idea', 'saved_idea')),
  idea_name text not null default '',
  report_markdown text not null,
  score integer null check (score is null or (score >= 0 and score <= 10)),
  model text null,
  created_at timestamptz not null default now()
);

create index if not exists idea_ai_reports_idea_id_idx on public.idea_ai_reports(idea_id);
create index if not exists idea_ai_reports_saved_idea_id_idx on public.idea_ai_reports(saved_idea_id);
create index if not exists idea_ai_reports_created_at_idx on public.idea_ai_reports(created_at desc);

alter table public.idea_ai_reports enable row level security;

drop policy if exists "Allow public read idea ai reports" on public.idea_ai_reports;
drop policy if exists "Allow public insert idea ai reports" on public.idea_ai_reports;
drop policy if exists "Allow public update idea ai reports" on public.idea_ai_reports;
drop policy if exists "Allow public delete idea ai reports" on public.idea_ai_reports;

create policy "Allow public read idea ai reports"
  on public.idea_ai_reports for select
  using (true);

create policy "Allow public insert idea ai reports"
  on public.idea_ai_reports for insert
  with check (true);

create policy "Allow public update idea ai reports"
  on public.idea_ai_reports for update
  using (true)
  with check (true);

create policy "Allow public delete idea ai reports"
  on public.idea_ai_reports for delete
  using (true);

grant select, insert, update, delete on public.idea_ai_reports to anon, authenticated;
