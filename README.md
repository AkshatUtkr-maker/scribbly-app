# Scribbly 📝

Notes app with offline support, Supabase sync, public feed, likes, views, and comments.

---

## Setup (do this first)

### 1. Paste your Supabase keys
Open `src/supabase.js` and replace:
```js
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'
```

### 2. Run the SQL in Supabase → SQL Editor

```sql
-- Notes table (if not already created)
create table if not exists notes (
  id text primary key,
  title text,
  body text,
  visibility text default 'private',
  is_anon boolean default false,
  author text,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
alter table notes enable row level security;
create policy "Public notes readable by all" on notes for select using (visibility = 'public');
create policy "Users manage own notes" on notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Anyone can insert notes" on notes for insert with check (true);

-- Comments
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  note_id text references notes(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  author text,
  body text,
  created_at timestamptz default now()
);
alter table comments enable row level security;
create policy "Anyone can read comments" on comments for select using (true);
create policy "Logged in users can comment" on comments for insert with check (auth.uid() = user_id);

-- Likes
create table if not exists likes (
  id uuid default gen_random_uuid() primary key,
  note_id text references notes(id) on delete cascade,
  created_at timestamptz default now()
);
alter table likes enable row level security;
create policy "Anyone can read likes" on likes for select using (true);
create policy "Anyone can like" on likes for insert with check (true);

-- Views
create table if not exists views (
  id uuid default gen_random_uuid() primary key,
  note_id text references notes(id) on delete cascade,
  created_at timestamptz default now()
);
alter table views enable row level security;
create policy "Anyone can read views" on views for select using (true);
create policy "Anyone can add view" on views for insert with check (true);
```

### 3. Install dependencies
```bash
npm install
```

---

## Run on web (for testing)
```bash
npm run dev
```

---

## Build APK (Android)

### Prerequisites
- Install [Android Studio](https://developer.android.com/studio) (free)
- Install [Node.js](https://nodejs.org) 18+

### Steps
```bash
# 1. Install Capacitor CLI
npm install -g @capacitor/cli

# 2. Build the web app + sync to Android
npm run cap:sync

# 3. This will open Android Studio automatically
# If it doesn't, run:
npx cap open android
```

### In Android Studio:
1. Wait for Gradle sync to finish (takes 2-3 minutes first time)
2. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Click **locate** when done — your APK is ready!

### Install on your phone:
- Transfer the APK to your phone
- Go to Settings → Install unknown apps → allow your file manager
- Tap the APK to install

---

## Deploy to web (Vercel)
1. Push to GitHub
2. Connect to Vercel
3. Done — `vercel.json` handles routing automatically

---

## Play Store (later)
When ready, use **Build → Generate Signed Bundle / APK** in Android Studio.
You'll need a keystore file — Android Studio walks you through creating one.
