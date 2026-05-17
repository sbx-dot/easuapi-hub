# EasyAPI Hub

EasyAPI Hub is a Next.js demo for an AI API gateway dashboard. This version keeps the API Key, recharge, order, and playground features as local demos, and adds a first real login/register flow with Supabase Auth.

## Current Scope

- Email registration and login with Supabase Auth
- Logout from the dashboard
- User email shown in the dashboard header
- No real payment integration yet
- No real AI API proxy yet
- No custom business database tables yet

## Supabase Setup

1. Go to [Supabase](https://supabase.com/) and create a new project.
2. In the Supabase dashboard, open the API Keys page.
3. Copy these values:
   - `Project URL`
   - `Publishable key`
4. Open `Authentication -> Providers -> Email`.
5. Make sure Email auth is enabled.
6. For the easiest first test, you can temporarily disable email confirmation. If you keep confirmation enabled, users must confirm the email before they can log in.
7. Open `Authentication -> URL Configuration` and add your deployed Netlify domain to the allowed redirect URLs, for example:
   - `https://your-site.netlify.app`
   - `https://your-custom-domain.com`

## Environment Variables

Create a local `.env.local` file based on `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

For Netlify, add the same variables in:

`Site configuration -> Environment variables`

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

After adding or changing environment variables in Netlify, redeploy the site.

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click `打开控制台`, then register or log in with an email and password.

## Production Test Checklist

1. Deploy the project to Netlify.
2. Confirm the Netlify environment variables are set.
3. Open the deployed site.
4. Click `打开控制台`.
5. Register a new account.
6. If email confirmation is enabled, confirm the email first.
7. Log in and confirm the dashboard opens.
8. Confirm your email appears in the top-right corner of the dashboard.
9. Click `退出` and confirm you return to the homepage.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
