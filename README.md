# LK Studio — Multi-Shop Tailor Platform

SaaS-style app for **many tailor shops** and **unlimited customers**: each shop has its own designs, orders, and bills. Customers browse shops, place stitching or **repair** orders with **multiple photos** (camera/gallery), and view bills with **advance / paid / pending**. Shops manage subscriptions (30-day trial, monthly renew demo).

**Languages:** English, Telugu (తెలుగు), Hindi (हिन्दी) — switch from the header on any page.

Works on **desktop browser** (shop) and **mobile browser** (shop + customer). Install as app: open in Chrome → menu → **Add to Home screen** (PWA manifest included).

## Quick start

```bash
cd C:\Users\saima\Projects\lk-studio
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Phone on any Wi‑Fi or mobile data (no IP setup)

```powershell
npm run dev:anywhere
```

Open the **https://…** link printed in the terminal on your phone. See [MOBILE-ANYWHERE.md](./MOBILE-ANYWHERE.md).

### Demo accounts (mobile + password)

| Role     | Mobile (🇮🇳 +91) | Password  |
|----------|------------------|-----------|
| Shop 1   | 9876543210       | demo123   |
| Shop 2   | 9988776655       | demo123   |
| Customer | 9123456789       | demo123   |

Login uses **mobile number only** — no email required.

## Features

### Shop owner
- Dashboard with order counts
- Upload design images by category
- View customer measurements and update order status (Pending → Measuring → Stitching → Ready → Delivered)
- Bill book with amount, paid flag, voice text (dictation) and voice file upload
- Shop profile: address, phone, Instagram, UPI ID, UPI QR image

### Customer
- Add family members and save measurements per person
- Browse designs by Maggam / Embroidery / Blouse
- Place order linked to person + design
- Track order status
- View shop contact and payment details

## Production notes

- Change `JWT_SECRET` in `.env`
- Use PostgreSQL instead of SQLite for production (`provider = "postgresql"` in `schema.prisma`)
- Host uploads on cloud storage (S3, etc.) instead of `public/uploads`
- Add HTTPS and set `secure` cookies

## Tech stack

Next.js 15, Prisma, SQLite, Tailwind CSS 4, JWT session cookies
