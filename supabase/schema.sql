-- ============================================================
-- Idea Manager - Supabase schema
-- Run this in Supabase SQL editor (Project > SQL Editor > New query)
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- niches
-- ------------------------------------------------------------
create table if not exists niches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- sub_niches
-- ------------------------------------------------------------
create table if not exists sub_niches (
  id uuid primary key default gen_random_uuid(),
  niche_id uuid not null references niches(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- product_types
-- ------------------------------------------------------------
create table if not exists product_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- assignees
-- ------------------------------------------------------------
create table if not exists assignees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ideas
-- ------------------------------------------------------------
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
  is_saved boolean not null default false,
  saved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_ideas_niche on ideas(niche_id);
create index if not exists idx_ideas_saved on ideas(is_saved);
create index if not exists idx_ideas_deleted on ideas(deleted_at);

-- ------------------------------------------------------------
-- updated_at trigger
-- ------------------------------------------------------------
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

-- ============================================================
-- Row Level Security
-- Vì chỉ có 2 người dùng nội bộ dùng chung 1 anon key, ta bật RLS
-- và cho phép đọc/ghi công khai qua anon key (không có dữ liệu
-- nhạy cảm cá nhân trong bảng này). Điều này ngăn việc khách truy
-- cập trực tiếp REST endpoint mà không qua policy được định nghĩa,
-- và giúp dễ dàng siết chặt sau này nếu cần.
-- ============================================================

alter table niches enable row level security;
alter table sub_niches enable row level security;
alter table product_types enable row level security;
alter table assignees enable row level security;
alter table ideas enable row level security;

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
