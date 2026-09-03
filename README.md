# Cakestry AI Assistant

Enterprise AI assistant serving **Cakestry Bakery Bahawal Nagar** across two divisions:

| | |
| --- | --- |
| 🎂 **Cakestry Bakery & Custom Cakes** | Birthday cakes, custom fondant cakes, wedding cakes, fresh pastries, delivery |
| 🧁 **Cakestry Special Events & Gift Boxes** | Event catering, dessert tables, corporate gift boxes, party packages |

The assistant determines which division a customer needs, remembers that choice throughout the conversation, allows switching at any time, and manages orders and event inquiries through dedicated CRM workflows.

---

## ✨ Features

- 👋 **Welcome Screen & Division Picker** — "Please choose how I can assist your order today"
- 🧭 **AI Department Router** — Infers intent from natural language (English, Urdu, Roman Urdu, Punjabi)
- 🎨 **Dynamic UI Re-theming** — Warm bakery styling for custom cakes and event catering
- 📝 **In-Chat Workflow Forms** — Order quotations, tasting meetings, event inquiries, support tickets
- 🟢 **WhatsApp Integration** — Meta Cloud API webhook, automated order taking, human handoff
- 📊 **CRM & Admin Panel** (`/admin`) — Bakery order tracking, event bookings, catalogue management, customer records

---

## 🧱 Tech Stack

- **Framework**: Next.js 15 (App Router) · React 19 · TypeScript
- **UI**: Tailwind CSS · Framer Motion · Lucide Icons
- **Database**: PostgreSQL (Supabase) via Prisma ORM
- **AI Engine**: OpenAI GPT-3.5 / GPT-4 / Claude / Gemini
- **Messaging**: Meta WhatsApp Cloud API

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env

# 3. Push schema to Supabase & seed database
npx prisma db push
npm run db:seed

# 4. Start local development server
npm run dev
```

App running on **http://localhost:3000** → chat interface at `/chat`, admin dashboard at `/admin`.

Seed accounts:

| Account | Email | Password | Access Scope |
| --- | --- | --- | --- |
| Developer / Super Admin | `developer@cakestry.com` | `Password123!` | System Developer Dashboard (Full Access) |
| Bakery Administrator | `admin@cakestry.com` | `Password123!` | Bakery Admin Dashboard |
| Bakery Staff Agent | `staff@cakestry.com` | `Password123!` | Bakery Staff Dashboard |
| Events Staff Officer | `events@cakestry.com` | `Password123!` | Events Staff Dashboard |

---

## 🌐 Production Deployment (Database Mart VPS)

For deploying to **Database Mart VPS hosting** and connecting your custom domain:

1. **DNS**: Point domain `A` record (`@` & `www`) to your Database Mart VPS Public IP.
2. **Server Setup**: Install Node.js 20, Nginx, Certbot, PM2.
3. **Build & PM2**: `npm ci && npx prisma db push && npm run db:seed && npm run build && pm2 start npm --name "cakestry" -- start`
4. **Nginx & SSL**: Configure Nginx reverse proxy on port 3000 (with `proxy_buffering off` for `/api/chat`) and run `sudo certbot --nginx`.

For complete step-by-step commands, view [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## 📜 Available Scripts

- `npm run dev`: Start Next.js development server
- `npm run build`: Generate Prisma client and compile Next.js production build
- `npm start`: Launch Next.js production server
- `npm run typecheck`: Run TypeScript compilation check
- `npm run db:seed`: Seed database with initial products, categories, and accounts

---

<div align="center">

**Cakestry Bakery Bahawal Nagar**
Model Town, Bahawal Nagar, Punjab, Pakistan · Ph: +92 300 1234567

</div>
