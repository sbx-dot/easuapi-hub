# EasyAPI Hub

EasyAPI Hub is a Next.js demo for an AI API gateway dashboard. This version keeps the API Key, recharge, order, and playground features as local demos, and adds a first real login/register flow with Supabase Auth.

## Current Scope

- Email registration and login with Supabase Auth
- Logout from the dashboard
- User email shown in the dashboard header
- User balance, API Key list, orders, and usage logs read from Supabase tables
- API Key creation stores only a prefix and SHA-256 hash
- OpenAI-compatible JSON relay endpoint at `/api/v1/chat/completions`
- No real payment integration yet
- No streaming relay yet

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
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
UPSTREAM_BASE_URL=https://api.openai.com/v1
UPSTREAM_API_KEY=your-upstream-api-key
UPSTREAM_DEFAULT_MODEL=gpt-4o-mini
API_PRICE_PER_1K_TOKENS=0.01
```

`NEXT_PUBLIC_SUPABASE_URL` must be the project base URL only. Do not include `/rest/v1`, `/auth/v1`, or any other path.
`SUPABASE_SERVICE_ROLE_KEY` and `UPSTREAM_API_KEY` are server-only secrets. Never prefix them with `NEXT_PUBLIC_`, never put them in browser code, and never commit real values to GitHub.

For Netlify, add the same variables in:

`Site configuration -> Environment variables`

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTREAM_BASE_URL`
- `UPSTREAM_API_KEY`
- `UPSTREAM_DEFAULT_MODEL`
- `API_PRICE_PER_1K_TOKENS`

After adding or changing environment variables in Netlify, redeploy the site.

## User Data Tables

Run the SQL in `supabase/user-data-schema.sql` inside the Supabase SQL Editor. It creates:

- `profiles`
- `api_keys`
- `orders`
- `usage_logs`

It also enables Row Level Security, adds user-only read policies, allows users to create and revoke their own API keys, and creates a trigger that automatically inserts a `profiles` row when a new auth user signs up.
It also adds an index on `api_keys.key_hash`, used by the API relay to validate user API keys.

### Admin Manual Recharge

The same SQL file also creates the `manual_recharge` RPC function. It lets only users with `profiles.role = 'admin'` manually add balance to another user and create a paid order record.

To make your own account an admin, run this in the Supabase SQL Editor after your account has signed up and has a `profiles` row:

```sql
update public.profiles
set role = 'admin'
where lower(email) = lower('your-email@example.com');
```

Replace `your-email@example.com` with your real login email. Do not put this SQL in frontend code.

## API Relay

The first API relay endpoint is:

```txt
POST /api/v1/chat/completions
```

It accepts OpenAI-compatible non-streaming JSON requests. Users call it with the API Key generated in the dashboard:

```js
fetch("https://eelapi.com/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer 用户自己的API_KEY"
  },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
      { role: "user", content: "你好" }
    ]
  })
})
```

Python:

```py
from openai import OpenAI

client = OpenAI(
    api_key="用户自己的API_KEY",
    base_url="https://eelapi.com/api/v1"
)

completion = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "user", "content": "你好"}
    ]
)

print(completion.choices[0].message.content)
```

The first version rejects `stream=true`, does not store user prompts, records usage tokens when the upstream returns `usage`, and deducts balance using `API_PRICE_PER_1K_TOKENS`.

Safety limits in the first version:

- Each API Key can make at most 20 requests per minute.
- `stream=true` returns `400`.
- `messages` total serialized length must be no more than 20,000 characters.
- `max_tokens` must be no more than 4096.

Common errors:

- `400`: stream is unsupported, or request limits were exceeded.
- `401`: missing or invalid API Key.
- `402`: insufficient balance.
- `429`: too many requests.

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
