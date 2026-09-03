# Deployment Guide — Cakestry AI Assistant

This guide covers deploying the **Cakestry AI Assistant** to a production Linux server using **Docker + Nginx**, plus a **PM2** alternative and a **GitHub Actions** CI/CD outline.

---

## 1. Prerequisites

- A Linux server (Ubuntu 22.04+ recommended) with a public IP / domain
- Docker + Docker Compose **or** Node.js 20+ and PM2
- PostgreSQL 14+ (managed Supabase PostgreSQL or containerised) and Redis (optional)
- An AI provider key (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.)
- A domain name and TLS certificate (Let's Encrypt)

---

## 2. Environment

```bash
git clone <your-repo-url> cakestry-assistant && cd cakestry-assistant
cp .env.example .env
```

Set production values in `.env`:

- `NODE_ENV=production`
- `APP_URL` / `NEXT_PUBLIC_APP_URL` = `https://your-domain`
- `DATABASE_URL` / `DIRECT_DATABASE_URL` = production Supabase PostgreSQL
- `JWT_SECRET` = `openssl rand -base64 48`
- `AI_PROVIDER` + matching API key and `AI_MODEL`
- `SALES_NOTIFY_EMAIL` and `ADMISSIONS_NOTIFY_EMAIL` (`order@cakestry.com` / `events@cakestry.com`)
- `SEED_ADMIN_PASSWORD` / `SEED_STAFF_PASSWORD`

---

## 3. Deploy with Docker Compose

```bash
docker compose up -d --build
docker compose exec web npx prisma db push
docker compose exec web npm run db:seed          # first deploy only
docker compose logs -f web
```

Health check: `curl http://localhost:3000/api/health`.

---

## 4. Nginx Reverse Proxy + TLS

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Frame-Options SAMEORIGIN always;

    client_max_body_size 15m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Streaming (SSE) — disable proxy buffering for /api/chat.
    location /api/chat {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
    }
}
```

---

<div align="center">
Cakestry Bakery Bahawal Nagar
</div>
