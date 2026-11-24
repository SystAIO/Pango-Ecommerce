# Deployment (self-hosted PostgreSQL, no Supabase)

Two Node processes: **backend :4100**, **frontend :3100**. Apache/cPanel serves the
domain and proxies `/` to port 3000. Images go either to Cloudflare R2 or to a
public local folder on the server.

The backend talks to PostgreSQL directly through `backend/lib/db.ts` — it keeps
the old supabase-js query-builder API, but there is **no Supabase service**.

---

## 1. PostgreSQL (one time)

Create a role + database, then apply the SQL in this order:

```bash
sudo -u postgres psql -c "CREATE ROLE pango LOGIN PASSWORD 'STRONG_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE pango_ecommerce OWNER pango;"

cd ~/pango-ecommerce/backend

# Roles + auth.uid() shim (Supabase provides these automatically; plain PG does not)
sudo -u postgres psql -d pango_ecommerce -f supabase/local-postgres.sql

# Tables, functions, RLS
sudo -u postgres psql -d pango_ecommerce -f supabase/schema.sql

# The catalogue seed is intentionally EMPTY — add products in the admin dashboard.
sudo -u postgres psql -d pango_ecommerce -f supabase/seed.sql

# Optional: promote your account to admin
sudo -u postgres psql -d pango_ecommerce -f supabase/admin.sql
```

Grant the app role access:

```bash
sudo -u postgres psql -d pango_ecommerce -c '
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pango;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pango;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO pango;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO pango;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO pango;
'
```

## 2. Environment

```bash
cd ~/pango-ecommerce/backend
cp .env.example .env
nano .env
```

Required:

```bash
DATABASE_URL=postgres://pango:STRONG_PASSWORD@127.0.0.1:5432/pango_ecommerce
JWT_SECRET=<long random string>
PORT=4100
FRONTEND_URL=https://your-domain.com
```

Image storage — pick one:

```bash
# Cloudflare R2 (recommended)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_PUBLIC_URL=https://cdn.your-domain.com

# OR local disk
LOCAL_UPLOAD_DIR=/home/pango/public_html/uploads
LOCAL_UPLOAD_URL=https://your-domain.com/uploads
```

For local disk, create the folder:

```bash
mkdir -p /home/pango/public_html/uploads
chmod 755 /home/pango/public_html/uploads
```

Frontend:

```bash
cd ~/pango-ecommerce/frontend
cp .env.example .env.local
# BACKEND_URL=http://127.0.0.1:4100
```

## 3. Build & run

```bash
cd ~/pango-ecommerce
npm install -g pm2

cd backend && npm ci && npm run build && cd ..
cd frontend && npm ci && npm run build && cd ..

pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # run the command it prints to enable boot start
```

Verify:

```bash
curl http://127.0.0.1:4100/api/health
curl -I http://127.0.0.1:3100
pm2 logs
```

## 4. Apache / cPanel reverse proxy

In cPanel → **Domains → your domain → Reverse Proxy**, map the domain to
`http://127.0.0.1:3100` and save. cPanel writes the vhost for you.

If your cPanel has no Reverse Proxy UI, add a `.htaccess` in the domain's
`public_html` (requires `mod_proxy`):

```apache
RewriteEngine On
RewriteRule ^(.*)$ http://127.0.0.1:3100/$1 [P,L]
```

Then point the domain's document root at that `public_html`.

## 5. First login

Sign up at `https://your-domain.com/signup`, then promote the account:

```bash
sudo -u postgres psql -d pango_ecommerce -c \
  "UPDATE users SET role='admin' WHERE email='you@example.com';"
```

## 6. Updates

```bash
cd ~/pango-ecommerce
git pull origin main
cd backend && npm ci && npm run build && cd ..
cd frontend && npm ci && npm run build && cd ..
pm2 restart pango-backend pango-frontend
```

## Notes

- Ports 3100 and 4100 are free on the target server.
- Keep this app's DB, folder, PM2 names and ports separate from `silai-saathi`
  and `Kishivi-website`.
- `.env` files are gitignored — they must be created on the server.
