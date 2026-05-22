# Enterprise Sales Control Tower Deployment

## Fastest Public Link Option

Use Netlify Drop for a quick public URL.

1. Open https://app.netlify.com/drop
2. Drag the file `enterprise-sales-control-tower-deploy.zip` into the page.
3. Netlify will create a public URL.
4. Share that URL with your sales team.

## Important Login Note

The current app can be deployed immediately, but users created in Settings are stored in the browser unless Supabase is connected.

That means:

- For demo/testing: Netlify public URL is enough.
- For real team login from different laptops/mobiles: Supabase must be connected so users, leads, targets, reports, and login data are shared online.

## Supabase Setup for Real Multi-User Login

1. Create a Supabase project at https://supabase.com
2. Open Supabase SQL Editor.
3. Run `supabase-schema.sql`.
4. Go to Project Settings > API.
5. Copy:
   - Project URL
   - anon public key
6. Open the CRM as admin.
7. Go to Settings.
8. Paste the Supabase URL and anon key.
9. Save Supabase Config.

## Recommended Production Setup

For actual sales team usage:

- Host frontend on Netlify or Vercel.
- Use Supabase for database, auth, row-level security, and realtime.
- Create master/admin login first.
- Add sales users from Settings.
- Give each user the public website URL, email ID, and password.

## Files to Deploy

Deploy these files:

- `index.html`
- `styles.css`
- `app.js`

Keep these files for setup/admin reference:

- `supabase-schema.sql`
- `start-crm-server.ps1`
- `DEPLOYMENT.md`
