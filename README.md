# Enterprise Sales Control Tower — Production CRM

A full-featured sales CRM with Supabase backend and Vercel deployment.

## 🚀 Quick Deploy to Vercel (No Build Required)

### Option 1: Static HTML Version (Fastest)
1. Use `index-production.html` (the enhanced version with Supabase auth)
2. Push to GitHub
3. Import to Vercel
4. Add environment variables in Vercel dashboard
5. Deploy ✅

### Option 2: Next.js Version (Full App)
Requires Node.js 18+ installed locally.

```bash
npm install
npm run build
vercel deploy --prod
```

## 📋 Prerequisites

1. **Supabase Project**
   - Create account at https://supabase.com
   - Create new project
   - Note your Project URL and anon key

2. **Vercel Account**
   - Create account at https://vercel.com
   - Connect your GitHub account

## 🔧 Setup Instructions

### Step 1: Supabase Database Setup

1. Go to your Supabase project
2. Open SQL Editor
3. Run the entire `supabase-schema.sql` file
4. This creates all tables, RLS policies, and auth triggers

### Step 2: Create Admin User

In Supabase Dashboard → Authentication → Users:
- Click "Invite user"
- Enter admin email
- User will receive confirmation email
- After confirming, they can sign in

Or use SQL:
```sql
-- The auth trigger will auto-create the profile
-- Just sign up via the app login page
```

### Step 3: Deploy to Vercel

#### Using Static HTML (No Build):
1. Rename `index-production.html` to `index.html` (backup the old one)
2. Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [{ "src": "index.html", "use": "@vercel/static" }],
  "routes": [{ "src": "/(.*)", "dest": "/index.html" }]
}
```
3. Push to GitHub
4. Import to Vercel
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
6. Deploy

#### Using Next.js (Full Build):
1. Install Node.js 18+ from https://nodejs.org
2. Run `npm install`
3. Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```
4. Test locally: `npm run dev`
5. Push to GitHub
6. Import to Vercel
7. Add same environment variables in Vercel dashboard
8. Deploy

## 🎯 Features

- ✅ Supabase Authentication (email/password)
- ✅ Row Level Security (RLS) — admins see all, managers see only their data
- ✅ Real-time updates for leads
- ✅ Full CRUD for leads, targets, meetings, activities
- ✅ Dashboard with charts and KPIs
- ✅ PPU/NPU tracking
- ✅ Target vs achievement reporting
- ✅ Follow-up management
- ✅ CSV export for all reports
- ✅ Mobile responsive
- ✅ 10-20 users supported

## 👥 User Roles

### Admin
- Full access to all data
- Can create/edit sales managers
- Can set targets
- Can view all leads across all managers

### Sales Manager
- Can only see their own leads
- Can create/edit their own leads
- Can view their own targets (read-only)
- Can track their own activities and follow-ups

## 📊 Data Model

- **Users** — Auth profiles (admin or sales_manager)
- **Sales Managers** — Manager details and status
- **Leads** — Client prospects with full pipeline tracking
- **Targets** — Monthly/Quarterly targets per manager
- **Meetings** — Meeting records linked to leads
- **Activities** — Daily activity log
- **Follow-ups** — Pending actions and due dates
- **Revenue** — Closed won revenue tracking

## 🔐 Security

- Supabase Auth handles all authentication
- Row Level Security (RLS) enforces data access
- Admins can see everything
- Sales managers can only access their own data
- All API calls go through Supabase with automatic auth

## 📱 Mobile Support

Fully responsive design works on:
- Desktop (1920px+)
- Laptop (1366px+)
- Tablet (768px+)
- Mobile (375px+)

## 🛠️ Tech Stack

### Static Version:
- Vanilla JavaScript
- Supabase JS SDK (CDN)
- Chart.js for visualizations
- CSS Grid/Flexbox

### Next.js Version:
- Next.js 14 (App Router)
- React 18
- TypeScript
- Supabase SSR
- Chart.js + react-chartjs-2
- Tailwind CSS (via globals.css)

## 📞 Support

For issues:
1. Check Supabase logs (Dashboard → Logs)
2. Check browser console for errors
3. Verify environment variables are set
4. Ensure RLS policies are active

## 🎨 Customization

### Branding
Edit in the code:
- `APP_NAME` constant
- CSS variables in `:root`
- Logo/colors in sidebar

### Rates
- PPU_RATE = 5000 (₹5,000 per outlet)
- NPU_RATE = 30000 (₹30,000 per outlet)

### Cities
Add to `CITIES` array in constants

## 📈 Scaling

Current setup supports:
- 10-20 concurrent users ✅
- 1000s of leads ✅
- Real-time updates ✅

For 50+ users:
- Upgrade Supabase plan
- Add database indexes
- Consider caching layer

## 🚢 Deployment Checklist

- [ ] Supabase project created
- [ ] Schema SQL executed
- [ ] Admin user created
- [ ] Environment variables set
- [ ] Vercel project connected
- [ ] First deployment successful
- [ ] Login tested
- [ ] Data entry tested
- [ ] RLS verified (manager can't see other manager's data)
- [ ] Real-time updates working

## 📝 License

Proprietary — for internal use only.
