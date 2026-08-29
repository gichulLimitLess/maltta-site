-- ============================================
-- 마이그레이션: 체크 기록/마지막 위치를 사용자별로 분리
--
-- 대상: 기존 schema.sql(단일 사용자 버전)로 이미 테이블을 만든 프로젝트
-- 새로 만드는 프로젝트라면 이 파일 대신 갱신된 schema.sql을 쓰면 된다.
--
-- Supabase 대시보드 > SQL Editor 에 전체를 붙여넣고 한 번에 Run.
-- ============================================

-- 안전장치: 기존 기록이 남아 있으면 중단한다.
-- (user_id 컬럼을 NOT NULL로 추가할 때 기존 행을 어느 사용자 것으로 볼지
--  결정할 수 없기 때문. SQL Editor에서는 auth.uid()가 null이라 채울 수도 없다.)
do $$
begin
  if exists (select 1 from public.marks) or exists (select 1 from public.app_state) then
    raise exception
      '기존 marks/app_state 기록이 있습니다. 이 마이그레이션은 두 테이블이 비어 있을 때만 안전합니다.';
  end if;
end $$;

-- ---------- marks ----------
alter table public.marks
  add column user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade;

alter table public.marks drop constraint marks_pkey;
alter table public.marks add primary key (user_id, question_id);

drop policy if exists "authenticated full access" on public.marks;
create policy "own marks only" on public.marks
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- app_state ----------
alter table public.app_state
  add column user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade;

alter table public.app_state drop constraint app_state_pkey;
alter table public.app_state add primary key (user_id, key);

drop policy if exists "authenticated full access" on public.app_state;
create policy "own app_state only" on public.app_state
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- questions(문제은행)는 공유 유지이므로 변경 없음.
