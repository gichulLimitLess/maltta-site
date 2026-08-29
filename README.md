# 말따먹기 암기 퀴즈 (토목기사 실기)

토목기사 실기 용어 서술형("말따먹기") 405문항 암기용 개인 사이트.

- **스택**: Next.js 16 (App Router) + TypeScript + Tailwind CSS (shadcn 스타일 컴포넌트) + Supabase
- **페이지**: 퀴즈(타이핑 → 정답 확인 → 모름/애매/정답 체크) · 복습 노트(상태별 필터) · 문항 수정(지문/정답 편집) · 로그인
- **동기화**: 체크 기록·수정 내역·마지막 위치가 모두 Supabase DB에 저장되어 폰/PC 어디서나 이어짐

---

## 배포 순서 (약 15~20분)

### 1. Supabase 프로젝트 만들기 (무료)

1. https://supabase.com 가입 → **New project** (리전: Northeast Asia (Seoul) 권장)
2. 프로젝트 생성 후 좌측 **SQL Editor** 열기
3. `supabase/schema.sql` 내용을 붙여넣고 **Run** → 테이블 3개 + RLS 생성
4. 이어서 `supabase/seed.sql` 내용을 붙여넣고 **Run** → 405문항 입력
   - Table Editor에서 `questions` 테이블에 405행이 보이면 성공

### 2. 로그인 계정 만들기 (1개만)

1. 좌측 **Authentication → Users → Add user → Create new user**
2. 사용할 이메일/비밀번호 입력, **Auto Confirm User 체크** 후 생성
3. **중요**: Authentication → Sign In / Providers 설정에서 **"Allow new users to sign up"을 꺼주세요.**
   (남이 주소를 알아내도 계정을 만들 수 없게 막는 설정)

### 3. API 키 확인

- **Project Settings → API** (또는 API Keys)에서 아래 두 값을 복사:
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon` / `publishable` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. GitHub에 올리고 Vercel 배포 (무료)

1. 이 폴더를 GitHub 저장소로 push (private 권장)
   ```bash
   git init && git add -A && git commit -m "init"
   git remote add origin <저장소 URL> && git push -u origin main
   ```
2. https://vercel.com 가입(GitHub 연동) → **Add New → Project** → 저장소 import
3. **Environment Variables**에 3번의 두 값을 입력 후 **Deploy**
4. 배포 완료되면 `https://프로젝트명.vercel.app` 주소 발급 → 폰에서 접속해 로그인

### 5. 폰에서 앱처럼 쓰기 (선택)

- 발급된 주소를 폰 브라우저로 열고 **홈 화면에 추가** → 앱 아이콘처럼 사용 가능

---

## 로컬 개발

> Node.js **20.9 이상** 필요 (Next.js 16 요구사항)

```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev                  # http://localhost:3000
```

## 데이터 참고사항

- 문항 데이터는 원본 PDF("말따먹기 정리집")를 전사한 것으로, 원문에 오류로 의심되는 항목이 일부 있음
  (예: 기출① 79번 옹벽 안정 검토항목의 "전단" → 통상 "전도", 14~18년도 2번 조강포틀랜드 습윤양생 9일 → 통상 3일).
  발견 시 **문항 수정** 페이지에서 바로 고치면 됨.
- 문항 추가/삭제가 필요하면 Supabase Table Editor에서 `questions` 테이블을 직접 편집해도 됨.

## 구조

```
app/
  page.tsx          # 퀴즈
  review/page.tsx   # 복습 노트
  edit/page.tsx     # 문항 수정
  login/page.tsx    # 로그인
components/         # Nav + shadcn 스타일 UI
lib/supabase/       # 클라이언트/미들웨어 (세션 가드)
supabase/
  schema.sql        # 테이블 + RLS
  seed.sql          # 405문항 시드
```
