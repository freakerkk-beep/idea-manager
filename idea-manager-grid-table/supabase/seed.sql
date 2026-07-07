-- ============================================================
-- Idea Manager - seed data
-- Run AFTER schema.sql, in Supabase SQL editor.
-- Safe to re-run: it clears existing rows in these tables first.
-- ============================================================

truncate table ideas cascade;
truncate table sub_niches cascade;
truncate table niches cascade;
truncate table product_types cascade;
truncate table assignees cascade;

-- ------------------------------------------------------------
-- niches
-- ------------------------------------------------------------
insert into niches (name, is_active) values
  ('Pet', true),
  ('Sport', true),
  ('Job', true),
  ('Hobby', true),
  ('Family', true),
  ('Faith', true),
  ('Couple', true),
  ('Memorial', true),
  ('Holiday', true),
  ('Other', true);

-- ------------------------------------------------------------
-- sub_niches
-- ------------------------------------------------------------
insert into sub_niches (niche_id, name, is_active)
select id, sub.name, true
from niches, (values
  ('Dog Lover'), ('Cat Lover'), ('Pet Memorial'), ('Pet Safety'),
  ('Pet Feeding'), ('Pet Accessories'), ('Other Pet')
) as sub(name)
where niches.name = 'Pet';

insert into sub_niches (niche_id, name, is_active)
select id, sub.name, true
from niches, (values
  ('Baseball'), ('Basketball'), ('Soccer'), ('Fishing'), ('Golf'), ('Other Sport')
) as sub(name)
where niches.name = 'Sport';

insert into sub_niches (niche_id, name, is_active)
select id, sub.name, true
from niches, (values
  ('Nurse'), ('Teacher'), ('Engineer'), ('Office Worker'), ('Other Job')
) as sub(name)
where niches.name = 'Job';

insert into sub_niches (niche_id, name, is_active)
select id, sub.name, true
from niches, (values
  ('Gardening'), ('Music'), ('Reading'), ('Gaming'), ('Other Hobby')
) as sub(name)
where niches.name = 'Hobby';

insert into sub_niches (niche_id, name, is_active)
select id, sub.name, true
from niches, (values
  ('Mom'), ('Dad'), ('Grandparents'), ('New Baby'), ('Other Family')
) as sub(name)
where niches.name = 'Family';

-- ------------------------------------------------------------
-- product_types
-- ------------------------------------------------------------
insert into product_types (name, is_active) values
  ('Lamp', true),
  ('Keychain', true),
  ('Ornament', true),
  ('Memorial Urn', true),
  ('Bowl Stand', true),
  ('Dog Tag', true),
  ('Wall Decor', true),
  ('Desk Decor', true),
  ('Apparel', true),
  ('Other', true);

-- ------------------------------------------------------------
-- assignees
-- ------------------------------------------------------------
insert into assignees (name, is_active) values
  ('Chưa phân công', true),
  ('Người 1', true),
  ('Người 2', true);

-- ------------------------------------------------------------
-- sample ideas
-- ------------------------------------------------------------
insert into ideas (
  name, niche_id, sub_niche_id, product_type_id, product_url, target_customer,
  priority, status, assignee_id, evaluation, notes, is_saved, saved_at
)
select
  v.name, n.id, sn.id, pt.id, v.product_url, v.target_customer,
  v.priority, v.status, a.id, v.evaluation, v.notes, v.is_saved,
  case when v.is_saved then now() else null end
from (values
  ('Personalized Dog Bowl Stand', 'Pet', 'Dog Lover', 'Bowl Stand', 'https://example.com/dog-bowl-stand', 'Dog Owner', 'Cao', 'Đang prototype', 'Người 1', 'Oke', 'Khách hàng thích thiết kế gỗ khắc tên', true),
  ('NFC Dog Tag', 'Pet', 'Pet Safety', 'Dog Tag', 'https://example.com/nfc-dog-tag', 'Dog Owner', 'Trung bình', 'Đang nghiên cứu', 'Người 2', 'Bình thường', 'Cần kiểm tra chi phí chip NFC', false, null),
  ('Tennis Ball Pet Memorial Urn', 'Pet', 'Pet Memorial', 'Memorial Urn', 'https://example.com/pet-urn', 'Pet Owner', 'Cao', 'Đã duyệt', 'Người 1', 'Oke', 'Idea bán chạy mùa trước', true, null),
  ('Paw Clicker Keychain', 'Pet', 'Pet Accessories', 'Keychain', 'https://example.com/paw-keychain', 'Cat Owner', 'Thấp', 'Idea mới', 'Chưa phân công', null, 'Chờ nghiên cứu thêm', false, null),
  ('Cat Night Light', 'Pet', 'Cat Lover', 'Lamp', 'https://example.com/cat-lamp', 'Cat Owner', 'Trung bình', 'Chờ đánh giá', 'Người 2', 'Bình thường', '', false, null),
  ('Baseball Ornament', 'Sport', 'Baseball', 'Ornament', 'https://example.com/baseball-ornament', 'Baseball Fan', 'Cao', 'Đã chọn R&D', 'Người 1', 'Oke', 'Phù hợp mùa Giáng sinh', true, null),
  ('Nurse Desk Sign', 'Job', 'Nurse', 'Desk Decor', 'https://example.com/nurse-sign', 'Nurse', 'Trung bình', 'Đang thiết kế', 'Người 2', 'Bình thường', '', false, null),
  ('Teacher Name Plate', 'Job', 'Teacher', 'Desk Decor', 'https://example.com/teacher-plate', 'Teacher', 'Cao', 'Đang test', 'Người 1', 'Oke', 'Đã có mẫu thử nghiệm', true, null),
  ('Fishing Rod Holder', 'Hobby', 'Fishing', 'Wall Decor', 'https://example.com/fishing-holder', 'Fishing Fan', 'Thấp', 'Tạm hoãn', 'Chưa phân công', 'Loại bỏ', 'Chi phí sản xuất quá cao', false, null),
  ('Personalized Family Lamp', 'Family', 'Mom', 'Lamp', 'https://example.com/family-lamp', 'Mom', 'Cao', 'Idea mới', 'Chưa phân công', null, 'Ý tưởng cho mùa Mother''s Day', false, null)
) as v(name, niche_name, sub_niche_name, product_type_name, product_url, target_customer, priority, status, assignee_name, evaluation, notes, is_saved)
join niches n on n.name = v.niche_name
join sub_niches sn on sn.name = v.sub_niche_name and sn.niche_id = n.id
join product_types pt on pt.name = v.product_type_name
join assignees a on a.name = v.assignee_name;

-- fix the one "removed" sample idea to have status Đã loại bỏ, matching its evaluation
update ideas set status = 'Đã loại bỏ', deleted_at = now()
where name = 'Fishing Rod Holder';
