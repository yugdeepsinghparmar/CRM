# 🚀 Setup Guide — Enterprise Sales Control Tower

## What you have
A fully revamped CRM that runs as a static HTML file.
- Auth via Supabase (email + password)
- All data in Supabase (shared across all users, real-time)
- Deploys to Vercel in 5 minutes — no Node.js needed

---

## Step 1 — Create your Supabase project

1. Go to https://supabase.com and sign up / log in
2. Click **New Project**
3. Give it a name (e.g. `sales-crm`), set a database password, pick a region
4. Wait ~2 minutes for it to provision

---

## Step 2 — Run the database schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Open the file `supabase-schema.sql` from this folder
4. Copy the entire contents and paste into the SQL editor
5. Click **Run**
6. You should see "Success. No rows returned."

---

## Step 3 — Get your Supabase credentials

1. Go to **Project Settings** → **API** (left sidebar)
2. Copy:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon public** key — long JWT string

---

## Step 4 — Add your credentials to index.html

Open `index.html` in any text editor (Notepad, VS Code, etc.)

Find these two lines near the top of the `<script>` section:

```
const SUPA_URL = 'REPLACE_WITH_YOUR_SUPABASE_URL'
const SUPA_KEY = 'REPLACE_WITH_YOUR_SUPABASE_ANON_KEY'
```

Replace with your actual values:

```
const SUPA_URL = 'https://abcdefgh.supabase.co'
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

Save the file.

---

## Step 5 — Create your admin user in Supabase

1. In Supabase, go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter your admin email and a password
4. Click **Create user**
5. The auth trigger will automatically create their profile in the `users` table

To make them admin, run this in SQL Editor:
```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'your-admin@email.com';
```

---

## Step 6 — Deploy to Vercel

### Option A: Drag & Drop (Fastest)
1. Go to https://vercel.com and sign in
2. Click **Add New** → **Project**
3. Choose **Import from Git** OR use **Deploy from CLI**

### Option B: Via GitHub (Recommended)
1. Create a GitHub account if you don't have one
2. Create a new repository (e.g. `sales-crm`)
3. Upload these files to the repo:
   - `index.html`
   - `styles.css` (optional, styles are now inline)
   - `vercel.json`
4. Go to https://vercel.com → **Add New Project**
5. Import your GitHub repo
6. Click **Deploy**
7. Done! Vercel gives you a URL like `https://sales-crm-xyz.vercel.app`

---

## Step 7 — Add sales managers

1. Open your deployed URL
2. Log in with your admin credentials
3. Go to **Settings** → **Sales Managers** → **+ Add Manager**
4. Add each manager's name, email, active date

Then create their Supabase auth accounts:
1. Go to Supabase → **Authentication** → **Users** → **Add user**
2. Create user with their email + temporary password
3. Share the URL + their email + password with them

To link a manager's auth account to their sales_manager row, run:
```sql
UPDATE public.sales_managers sm
SET user_id = u.id
FROM public.users u
WHERE u.email = sm.email;
```

---

## Step 8 — Set targets

1. Log in as admin
2. Go to **Target Management**
3. Click **+ Add Target** for each manager
4. Set Monthly PPU targets and Quarterly NPU targets

---

## You're live! ✅

Share the Vercel URL with your team.
- Admins see all data across all managers
- Sales managers only see their own leads

---

## Troubleshooting

**"Profile not found" on login**
→ Run the SQL in Step 5 to set the role, or check the `users` table in Supabase

**"Supabase not configured"**
→ Check that SUPA_URL and SUPA_KEY are correctly set in index.html

**Manager can see other manager's data**
→ Make sure RLS is enabled — re-run the schema SQL

**Charts not showing**
→ Add some leads first — charts need data to render

---

## User Roles

| Feature | Admin | Sales Manager |
|---------|-------|---------------|
| See all leads | ✅ | ❌ (own only) |
| Add/edit leads | ✅ | ✅ (own only) |
| Set targets | ✅ | ❌ |
| Add managers | ✅ | ❌ |
| View reports | ✅ | ✅ (own data) |
| Export CSV | ✅ | ✅ |
