# Architecture — Cakestry AI Assistant

One application, two divisions for **Cakestry Bakery Bahawal Nagar**, with a clear separation between them:

| | |
| --- | --- |
| 🎂 **Cakestry Bakery & Custom Cakes** | Birthday cakes, custom fondant cakes, wedding cakes, pastries, delivery |
| 🧁 **Cakestry Special Events & Gift Boxes** | Event catering, dessert tables, corporate gift boxes, party packages |

---

## 1. System Overview

```
                        ┌──────────────────────────────┐
  Visitor ──────────────▶  /chat  (ChatWindow, client) │
                        └───────────────┬──────────────┘
                                        │ POST /api/chat  { messages, department }
                                        ▼
                        ┌──────────────────────────────┐
                        │  planAssistantTurn()         │
                        │   1. routeDepartment()       │  ← which division?
                        │   2. detectLanguage()        │  ← EN / UR / Roman UR / PA
                        │   3. retrieveKnowledge(dept) │  ← scoped knowledge
                        │   4. buildSystemPrompt()     │  ← division system prompt
                        └───────────────┬──────────────┘
                                        │
      SSE  meta → chunk… → done         ▼
   ◀────────────────────────  AI provider (OpenAI / Claude / Gemini)
                                        │
                                        ▼
                        ┌──────────────────────────────┐
                        │  Persistence (best effort)   │
                        │  conversations · messages    │
                        │  tickets · notifications     │
                        │  system_logs                 │
                        └──────────────────────────────┘

  Staff ────▶ /admin  ──▶ middleware ──▶ requireAdmin() ──▶ scoped Prisma queries
```

---

<div align="center">
Cakestry Bakery Bahawal Nagar
</div>
