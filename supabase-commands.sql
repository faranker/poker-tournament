-- ================================================================
-- POKER TOURNAMENT — Supabase SQL Commands
-- ================================================================


-- ----------------------------------------------------------------
-- ดูข้อมูล Users ทั้งหมด
-- ----------------------------------------------------------------
select
  u.id,
  u.email,
  u.created_at,
  p.username,
  s.plan,
  s.expires_at
from auth.users u
left join public.profiles p on p.user_id = u.id
left join public.subscriptions s on s.user_id = u.id
order by u.created_at desc;


-- ----------------------------------------------------------------
-- เปลี่ยน Plan รายบุคคล (ใส่ email ที่ต้องการ)
-- ----------------------------------------------------------------

-- → Full Pro (กำหนดวันหมดอายุ)
update public.subscriptions
set plan = 'full_pro', expires_at = now() + interval '7 days'
where user_id = (select id from auth.users where email = 'example@email.com');

-- → Cash Pro
update public.subscriptions
set plan = 'cash_pro', expires_at = now() + interval '30 days'
where user_id = (select id from auth.users where email = 'example@email.com');

-- → Free (ไม่มีวันหมดอายุ)
update public.subscriptions
set plan = 'free', expires_at = null
where user_id = (select id from auth.users where email = 'example@email.com');


-- ----------------------------------------------------------------
-- เปลี่ยน Plan ทุก User พร้อมกัน
-- ----------------------------------------------------------------

-- อัปเกรดทุกคนเป็น Full Pro 7 วัน
update public.subscriptions
set plan = 'full_pro', expires_at = now() + interval '7 days'
where plan = 'free';

-- รีเซ็ตทุกคนกลับ Free
update public.subscriptions
set plan = 'free', expires_at = null;


-- ----------------------------------------------------------------
-- ต่ออายุ Plan (ต่อจากวันที่หมดอายุ หรือจากวันนี้)
-- ----------------------------------------------------------------

-- ต่อจากวันนี้ +30 วัน
update public.subscriptions
set expires_at = now() + interval '30 days'
where user_id = (select id from auth.users where email = 'example@email.com');

-- ต่อจากวันหมดอายุเดิม +30 วัน (ถ้ายังไม่หมด)
update public.subscriptions
set expires_at = expires_at + interval '30 days'
where user_id = (select id from auth.users where email = 'example@email.com');


-- ----------------------------------------------------------------
-- ดู User ที่หมดอายุแล้ว / ใกล้หมด
-- ----------------------------------------------------------------

-- หมดอายุแล้ว
select u.email, s.plan, s.expires_at
from public.subscriptions s
join auth.users u on u.id = s.user_id
where s.expires_at < now();

-- หมดใน 3 วันข้างหน้า
select u.email, s.plan, s.expires_at
from public.subscriptions s
join auth.users u on u.id = s.user_id
where s.expires_at between now() and now() + interval '3 days';


-- ----------------------------------------------------------------
-- ลบ User (ลบจาก auth จะ cascade ลบ profiles + subscriptions ด้วย)
-- ----------------------------------------------------------------
delete from auth.users where email = 'example@email.com';


-- ----------------------------------------------------------------
-- ดู Export Log ของแต่ละ User
-- ----------------------------------------------------------------
select u.email, e.mode, e.exported_at
from public.export_logs e
join auth.users u on u.id = e.user_id
order by e.exported_at desc;

-- นับจำนวน export ของ user ในเดือนนี้
select u.email, count(*) as export_count
from public.export_logs e
join auth.users u on u.id = e.user_id
where date_trunc('month', e.exported_at) = date_trunc('month', now())
group by u.email
order by export_count desc;


-- ----------------------------------------------------------------
-- Trigger: ตั้งค่า Plan เริ่มต้นตอนสมัคร (full_pro 7 วัน)
-- ----------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.subscriptions (user_id, plan, expires_at)
  values (new.id, 'full_pro', now() + interval '7 days')
  on conflict (user_id) do nothing;
  return new;
end;
$$;
