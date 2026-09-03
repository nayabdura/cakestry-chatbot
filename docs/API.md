# API Reference — Cakestry AI Assistant

Base URL: `${APP_URL}` (e.g. `http://localhost:3000`). All endpoints are Next.js Route Handlers running on the Node.js runtime.

`department` is always one of `MARKETING` (Cakestry Bakery & Custom Cakes) | `INSTITUTE` (Cakestry Special Events).

---

## POST `/api/chat`

Stream an assistant reply. The response is **Server-Sent Events** (`text/event-stream`); each event is a `data:` line containing JSON.

### Request body
```json
{
  "conversationRef": "BX-CONV-AB12CD34EF",
  "department": "MARKETING",
  "requestedDepartment": null,
  "messages": [
    { "role": "user", "content": "Custom birthday cake price kitna hai?" }
  ]
}
```

---

## POST `/api/leads` — Cakestry Bakery Cake Order Capture

```json
{
  "name": "Ali Raza",
  "company": "Event Organizers",
  "phone": "03001234567",
  "email": "ali@example.com",
  "service": "birthday-cakes",
  "budget": "PKR 5,000 – 10,000",
  "timeline": "Within 2 days",
  "requirements": "2 pound chocolate fondant cake with custom birthday text",
  "conversationRef": "BX-CONV-AB12CD34EF"
}
```

`201` → `{ "ok": true, "reference": "BM-LEAD-7F3K2Q9A", "message": "…" }`

---

## POST `/api/admissions` — Cakestry Special Events Inquiry

```json
{
  "studentName": "Ayesha Khan",
  "phone": "03001234567",
  "course": "wedding-catering-package",
  "notes": "Wedding dessert table for 200 guests.",
  "conversationRef": "BX-CONV-AB12CD34EF"
}
```

`201` → `{ "ok": true, "reference": "BI-ADM-4X8T2M6C", "message": "…" }`

---

## Auth

| Endpoint | Body | Result |
| --- | --- | --- |
| `POST /api/auth/register` | `{ name, email, password, phone? }` | `200` + `Set-Cookie: cakestry_session` |
| `POST /api/auth/login` | `{ email, password }` | `200` + cookie |
| `POST /api/auth/logout` | — | `200`, clears the cookie |
