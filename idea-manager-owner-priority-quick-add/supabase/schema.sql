-- ============================================================
-- Idea Manager - Supabase schema
-- Chạy trong Supabase SQL Editor cho project mới.
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists niches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists sub_niches (
  id uuid primary key default gen_random_uuid(),
  niche_id uuid not null references niches(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists product_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists assignees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  niche_id uuid references niches(id) on delete set null,
  sub_niche_id uuid references sub_niches(id) on delete set null,
  product_type_id uuid references product_types(id) on delete set null,
  product_url text,
  target_customer text,
  priority text not null default 'Chưa đánh giá'
    check (priority in ('Chưa đánh giá','Thấp','Trung bình','Cao')),
  status text not null default 'Idea mới'
    check (status in (
      'Idea mới','Đang nghiên cứu','Chờ đánh giá','Đã chọn R&D','Đang thiết kế',
      'Đang prototype','Đang tính giá','Đang test','Đã duyệt','Tạm hoãn','Đã loại bỏ'
    )),
  assignee_id uuid references assignees(id) on delete set null,
  evaluation text check (evaluation in ('Oke','Bình thường','Loại bỏ') or evaluation is null),
  notes text,
  -- Hai cột cũ được giữ để tương thích dữ liệu trước đây.
  is_saved boolean not null default false,
  saved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Bảng lưu độc lập. Không dùng khóa ngoại tới ideas để bản lưu không bị mất
-- khi idea gốc được dọn/xóa khỏi niche.
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

create index if not exists idx_ideas_niche on ideas(niche_id);
create index if not exists idx_ideas_saved on ideas(is_saved);
create index if not exists idx_ideas_deleted on ideas(deleted_at);
create index if not exists idx_saved_ideas_saved_at on saved_ideas(saved_at desc);
create index if not exists idx_saved_ideas_niche on saved_ideas(niche_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_ideas_updated_at on ideas;
create trigger trg_ideas_updated_at
before update on ideas
for each row execute function set_updated_at();

drop trigger if exists trg_saved_ideas_updated_at on saved_ideas;
create trigger trg_saved_ideas_updated_at
before update on saved_ideas
for each row execute function set_updated_at();

alter table niches enable row level security;
alter table sub_niches enable row level security;
alter table product_types enable row level security;
alter table assignees enable row level security;
alter table ideas enable row level security;
alter table saved_ideas enable row level security;

drop policy if exists "public read niches" on niches;
create policy "public read niches" on niches for select using (true);
drop policy if exists "public write niches" on niches;
create policy "public write niches" on niches for all using (true) with check (true);

drop policy if exists "public read sub_niches" on sub_niches;
create policy "public read sub_niches" on sub_niches for select using (true);
drop policy if exists "public write sub_niches" on sub_niches;
create policy "public write sub_niches" on sub_niches for all using (true) with check (true);

drop policy if exists "public read product_types" on product_types;
create policy "public read product_types" on product_types for select using (true);
drop policy if exists "public write product_types" on product_types;
create policy "public write product_types" on product_types for all using (true) with check (true);

drop policy if exists "public read assignees" on assignees;
create policy "public read assignees" on assignees for select using (true);
drop policy if exists "public write assignees" on assignees;
create policy "public write assignees" on assignees for all using (true) with check (true);

drop policy if exists "public read ideas" on ideas;
create policy "public read ideas" on ideas for select using (true);
drop policy if exists "public write ideas" on ideas;
create policy "public write ideas" on ideas for all using (true) with check (true);

drop policy if exists "public read saved ideas" on saved_ideas;
create policy "public read saved ideas" on saved_ideas for select using (true);
drop policy if exists "public write saved ideas" on saved_ideas;
create policy "public write saved ideas" on saved_ideas for all using (true) with check (true);

-- Cấp quyền cho publishable/anon key.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on niches, sub_niches, product_types, assignees, ideas, saved_ideas to anon, authenticated;
