-- ============================================================
-- MIGRATION CHO WEBSITE ĐANG DÙNG
-- Chạy file này MỘT LẦN trong Supabase SQL Editor trước khi deploy code mới.
-- File không xóa dữ liệu hiện tại.
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists saved_ideas (
  id uuid primary key default gen_random_uuid(),
  source_idea_id uuid unique,
  name text not null,
  niche_id uuid,
  niche_name text,
  sub_niche_id uuid,
  sub_niche_name text,
  product_type_id uuid,
  product_type_name text,
  product_url text,
  target_customer text,
  priority text not null default 'Chưa đánh giá'
    check (priority in ('Chưa đánh giá','Thấp','Trung bình','Cao')),
  status text not null default 'Idea mới'
    check (status in (
      'Idea mới','Đang nghiên cứu','Chờ đánh giá','Đã chọn R&D','Đang thiết kế',
      'Đang prototype','Đang tính giá','Đang test','Đã duyệt','Tạm hoãn','Đã loại bỏ'
    )),
  assignee_id uuid,
  assignee_name text,
  evaluation text check (evaluation in ('Oke','Bình thường','Loại bỏ') or evaluation is null),
  notes text,
  saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_saved_ideas_source on saved_ideas(source_idea_id);
create index if not exists idx_saved_ideas_saved_at on saved_ideas(saved_at desc);
create index if not exists idx_saved_ideas_niche on saved_ideas(niche_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_saved_ideas_updated_at on saved_ideas;
create trigger trg_saved_ideas_updated_at
before update on saved_ideas
for each row execute function set_updated_at();

alter table saved_ideas enable row level security;

drop policy if exists "public read saved ideas" on saved_ideas;
create policy "public read saved ideas" on saved_ideas for select using (true);

drop policy if exists "public write saved ideas" on saved_ideas;
create policy "public write saved ideas" on saved_ideas for all using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on saved_ideas to anon, authenticated;

-- Chuyển các idea đã lưu theo cơ chế cũ sang bảng lưu độc lập.
insert into saved_ideas (
  source_idea_id,
  name,
  niche_id,
  niche_name,
  sub_niche_id,
  sub_niche_name,
  product_type_id,
  product_type_name,
  product_url,
  target_customer,
  priority,
  status,
  assignee_id,
  assignee_name,
  evaluation,
  notes,
  saved_at
)
select
  i.id,
  i.name,
  i.niche_id,
  n.name,
  i.sub_niche_id,
  sn.name,
  i.product_type_id,
  pt.name,
  i.product_url,
  i.target_customer,
  i.priority,
  i.status,
  i.assignee_id,
  a.name,
  i.evaluation,
  i.notes,
  coalesce(i.saved_at, now())
from ideas i
left join niches n on n.id = i.niche_id
left join sub_niches sn on sn.id = i.sub_niche_id
left join product_types pt on pt.id = i.product_type_id
left join assignees a on a.id = i.assignee_id
where i.is_saved = true
on conflict (source_idea_id) do nothing;

select count(*) as saved_ideas_total from saved_ideas;
