-- ============================================================
-- Idea Manager - thêm option trực tiếp trong dropdown
-- Chạy MỘT LẦN trong Supabase SQL Editor trước khi deploy code mới.
-- Không xóa dữ liệu hiện tại.
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.status_options (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 1000,
  created_at timestamptz not null default now()
);

-- Bỏ ràng buộc danh sách trạng thái cố định để có thể thêm trạng thái mới.
do $$
declare
  item record;
begin
  for item in
    select c.conname as constraint_name, t.relname as table_name
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname in ('ideas', 'saved_ideas')
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%status%'
  loop
    execute format('alter table public.%I drop constraint if exists %I', item.table_name, item.constraint_name);
  end loop;
end $$;

-- Tạo danh sách mặc định.
insert into public.status_options (name, sort_order)
values
  ('Idea mới', 10),
  ('Đang nghiên cứu', 20),
  ('Chờ đánh giá', 30),
  ('Đã chọn R&D', 40),
  ('Đang thiết kế', 50),
  ('Đang prototype', 60),
  ('Đang tính giá', 70),
  ('Đang test', 80),
  ('Đã duyệt', 90),
  ('Tạm hoãn', 100),
  ('Đã loại bỏ', 110)
on conflict (name) do nothing;

-- Giữ lại mọi trạng thái đã tồn tại trong dữ liệu cũ.
insert into public.status_options (name, sort_order)
select distinct status, 1000
from public.ideas
where status is not null and btrim(status) <> ''
on conflict (name) do nothing;

insert into public.status_options (name, sort_order)
select distinct status, 1000
from public.saved_ideas
where status is not null and btrim(status) <> ''
on conflict (name) do nothing;

-- Đổi tên trạng thái đồng bộ, không làm mất liên kết dữ liệu cũ.
create or replace function public.rename_status_option(p_id uuid, p_new_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_name text;
  clean_name text := btrim(p_new_name);
begin
  if clean_name is null or clean_name = '' then
    raise exception 'Tên trạng thái không được để trống';
  end if;

  select name into old_name
  from public.status_options
  where id = p_id
  for update;

  if old_name is null then
    raise exception 'Không tìm thấy trạng thái';
  end if;

  if old_name in ('Idea mới', 'Đã loại bỏ') then
    raise exception 'Trạng thái hệ thống không thể đổi tên';
  end if;

  if exists (
    select 1 from public.status_options
    where lower(name) = lower(clean_name) and id <> p_id
  ) then
    raise exception 'Trạng thái này đã tồn tại';
  end if;

  update public.ideas set status = clean_name where status = old_name;
  update public.saved_ideas set status = clean_name where status = old_name;
  update public.status_options set name = clean_name where id = p_id;
end;
$$;

alter table public.status_options enable row level security;

drop policy if exists "public read status options" on public.status_options;
create policy "public read status options"
on public.status_options for select
using (true);

drop policy if exists "public write status options" on public.status_options;
create policy "public write status options"
on public.status_options for all
using (true)
with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.status_options to anon, authenticated;
grant execute on function public.rename_status_option(uuid, text) to anon, authenticated;

select name, is_active, sort_order
from public.status_options
order by sort_order, name;
