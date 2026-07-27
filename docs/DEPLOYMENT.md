## Production Deployment

### Deploy to a VPS

1. **SSH into your server** and clone the repo:
   ```bash
   git clone https://github.com/asharma02192/SimpleAIFolio.git
   cd SimpleAIFolio
   ```

2. **Create and edit `.env`** with production values:
   ```bash
   cp .env.example .env
   nano .env
   ```
   Set strong passwords, secure secrets, and your admin credentials.

3. **Update URLs** for your domain:
   ```bash
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   ```

4. **Start the stack** — use the production compose file for secure network isolation:
   ```bash
   # Set the proxy network name (must match your reverse proxy's network)
   echo "EXTERNAL_PROXY_NETWORK=proxy_default" >> .env

   docker compose -f docker-compose.prod.yml up -d --build
   ```

   The production compose file configures three networks:
   - `app` (internal) — inter-service communication only, no internet
   - `egress` (bridge) — gives the backend outbound access for OpenAI, webhooks, etc.
   - `proxy` (external) — your reverse proxy joins this to reach frontend and backend

   This prevents the AI Blog Studio from failing with `EAI_AGAIN` errors caused by internal-only networking.

5. **Set up a reverse proxy** for HTTPS. See [`deploy/nginx.conf`](./deploy/nginx.conf) for a complete config with Docker DNS resolution (critical for container recreation without 502s).

   Key nginx directives:
   ```nginx
   resolver 127.0.0.11 valid=10s ipv6=off;

   location /api/ {
       proxy_pass http://backend:3001;
   }
   location / {
       proxy_pass http://frontend:3000;
   }
   ```

   Or use Caddy (automatic HTTPS):
   ```Caddyfile
   yourdomain.com {
       reverse_proxy frontend:3000
   }
   yourdomain.com {
       @api path /api/* /uploads/* /feed.xml
       handle @api {
           reverse_proxy backend:3001
       }
       handle {
           reverse_proxy frontend:3000
       }
   }
   ```

6. **Connect your AI tools** to `https://mcp.yourdomain.com/mcp` with your API key.

### Updating

```bash
git pull origin master
docker compose up -d --build
```

Your data persists in Docker volumes. Migrations run automatically on startup.

### Backing Up

```bash
# Backup database
docker compose exec db pg_dump -U SimpleAIFolio SimpleAIFolio > backup.sql

# Restore
docker compose exec -T db psql -U SimpleAIFolio SimpleAIFolio < backup.sql
```

---

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_PASSWORD` | PostgreSQL database password | `my-secure-password` |
| `JWT_SECRET` | JWT signing secret | Output of `openssl rand -hex 32` |
| `REVALIDATE_SECRET` | Frontend cache invalidation secret | Output of `openssl rand -hex 32` |
| `SEED_ADMIN_EMAIL` | Admin login email | `admin@example.com` |
| `SEED_ADMIN_PASSWORD` | Admin login password | `your-secure-password` |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `SEED_ADMIN_NAME` | `Admin` | Admin display name (also used as initial site title) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3201` | Public API URL (update for production) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3200` | Public site URL |
| `FRONTEND_URL` | `http://localhost:3200` | Used by backend for CORS/revalidation |

### AI Writer (configured via admin panel, not env vars)

Set these from **Admin > Settings > AI Configuration**:
- AI Provider (`openai-compatible` or `disabled`)
- API Key
- API Endpoint URL
- Model name
- Temperature and max tokens
