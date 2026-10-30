-- ============================================================
-- CEBFLORA DATABASE SCHEMA
-- Run this in Supabase SQL Editor (Project > SQL Editor > New query)
-- Implements: FR-01,02,03,04,06,07,08,09,10,11,12,13,14
--             BR-01 through BR-09
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILES  (extends Supabase's built-in auth.users)
-- ------------------------------------------------------------
-- role: 'user' (default, read-only) | 'curator' | 'admin'
-- BR-01: only curator/admin may write plant records
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  email text not null,
  role text not null default 'user' check (role in ('user','curator','admin')),
  has_seen_tutorial boolean not null default false, -- FR-05 / UR-03
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up via Supabase Auth
create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ------------------------------------------------------------
-- 2. CURATOR APPLICATIONS  (FR-04, FR-09, UR-08, UR-09, BR-02, BR-04)
-- ------------------------------------------------------------
create table curator_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  affiliation text not null,          -- e.g. "University of San Carlos - Biology Dept"
  proof_file_path text not null,      -- path inside the private 'curator-proofs' storage bucket
  status text not null default 'pending' check (status in ('pending','approved','declined')),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. PLANTS  (FR-06,07,08 / BR-03, BR-05, BR-07)
-- ------------------------------------------------------------
-- status: 'draft' (curator still editing) | 'published' (visible + usable in quiz/compare/wizard)
-- ecological_zone only (never exact coordinates) — BR-03
create table plants (
  id uuid primary key default gen_random_uuid(),
  scientific_name text not null,
  family text not null,
  genus text not null,
  local_name text,                     -- Cebuano name
  ecological_zone text not null check (ecological_zone in ('lowland','upland','coastal','mangrove','freshwater')),
  description text,
  source_collection text,              -- where the record/specimen data originated
  status text not null default 'draft' check (status in ('draft','published')),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Multimedia attachments for a plant (FR-06, SR-07, BR-07)
create table plant_media (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references plants(id) on delete cascade,
  media_type text not null check (media_type in ('image','audio','external_link')),
  url text not null,
  caption text,
  added_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. BOOKMARKS  (FR-10, UR-10)
-- ------------------------------------------------------------
create table bookmarks (
  user_id uuid not null references profiles(id) on delete cascade,
  plant_id uuid not null references plants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, plant_id)
);

-- ------------------------------------------------------------
-- 5. QUIZ QUESTIONS  (FR-12, BR-05 — must reference published plants only)
-- ------------------------------------------------------------
create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references plants(id) on delete cascade,
  question text not null,
  choices jsonb not null,      -- e.g. ["Arecaceae","Fabaceae","Poaceae","Lamiaceae"]
  correct_answer text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. REPORTS  (Help & Safety "File a Report" screen)
-- ------------------------------------------------------------
create table reports (
  id uuid primary key default gen_random_uuid(),
  reported_by uuid not null references profiles(id),
  report_type text not null,       -- e.g. 'incorrect_info' | 'inaccurate_record' | 'curator_concern'
  description text not null,
  proof_file_path text,
  status text not null default 'open' check (status in ('open','reviewed','closed')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- This is what actually enforces BR-01 through BR-09 at the
-- database level — the UI hiding a button is NOT security.
-- ============================================================

alter table profiles enable row level security;
alter table curator_applications enable row level security;
alter table plants enable row level security;
alter table plant_media enable row level security;
alter table bookmarks enable row level security;
alter table quiz_questions enable row level security;
alter table reports enable row level security;

-- Helper: is the current user a curator or admin?
create function is_curator_or_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('curator','admin')
  );
$$ language sql security definer stable;

create function is_admin()
returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

-- ---- PROFILES ----
create policy "Users can view all profiles" on profiles
  for select using (true); -- needed for public curator/institution profile pages (FR-11)

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- ---- PLANTS ---- (BR-01, BR-03, BR-05)
-- Public/guests + logged-in users: read only PUBLISHED plants
create policy "Anyone can read published plants" on plants
  for select using (status = 'published' or created_by = auth.uid() or is_admin());

-- Only curators/admins can create
create policy "Curators can insert plants" on plants
  for insert with check (is_curator_or_admin());

-- Only the curator who owns the record (or an admin) can edit/delete
create policy "Curators can update own plants" on plants
  for update using (created_by = auth.uid() or is_admin());

create policy "Curators can delete own plants" on plants
  for delete using (created_by = auth.uid() or is_admin());

-- ---- PLANT MEDIA ---- (BR-07)
create policy "Anyone can view media of published plants" on plant_media
  for select using (
    exists (select 1 from plants where plants.id = plant_id and plants.status = 'published')
  );

create policy "Curators manage media on their plants" on plant_media
  for all using (is_curator_or_admin());

-- ---- CURATOR APPLICATIONS ---- (BR-02, BR-04, SR-09)
create policy "Users can view their own application" on curator_applications
  for select using (user_id = auth.uid() or is_admin());

create policy "Users can submit an application" on curator_applications
  for insert with check (user_id = auth.uid());

-- Only admins may approve/decline (updates status, reviewed_by, reviewed_at)
create policy "Admins review applications" on curator_applications
  for update using (is_admin());

-- ---- BOOKMARKS ---- (BR-09: only logged-in users)
create policy "Users manage their own bookmarks" on bookmarks
  for all using (user_id = auth.uid());

-- ---- QUIZ QUESTIONS ---- (BR-05: only from published plants)
create policy "Anyone can read quiz questions from published plants" on quiz_questions
  for select using (
    exists (select 1 from plants where plants.id = plant_id and plants.status = 'published')
  );

create policy "Curators manage quiz questions" on quiz_questions
  for all using (is_curator_or_admin());

-- ---- REPORTS ----
create policy "Users can file their own reports" on reports
  for insert with check (reported_by = auth.uid());

create policy "Users view own reports, admins view all" on reports
  for select using (reported_by = auth.uid() or is_admin());

create policy "Admins update report status" on reports
  for update using (is_admin());

-- ============================================================
-- STORAGE BUCKETS (run these, or create via Supabase Dashboard > Storage)
-- ============================================================
-- 'curator-proofs'  -> PRIVATE bucket. Only the uploader + admins can read (SR-09).
-- 'plant-media'     -> PUBLIC bucket. Published plant photos.
-- 'report-proofs'   -> PRIVATE bucket. Screenshots attached to Help & Safety reports.
--
-- Create these in the Supabase Dashboard UI (Storage tab) and set:
--   curator-proofs: Public = OFF
--   plant-media:    Public = ON
--   report-proofs:  Public = OFF
