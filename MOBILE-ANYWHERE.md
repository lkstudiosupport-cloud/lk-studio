# Use LK Studio on phone — any Wi‑Fi or mobile data

You do **not** need to change IP addresses when you switch networks.

## One command (recommended)

On your PC:

```powershell
cd C:\Users\saima\Projects\lk-studio
npm run dev:anywhere
```

This will:

1. Start the dev server on port 3000  
2. Create a **public HTTPS link** (e.g. `https://something.loca.lt`)  
3. Print the link in the terminal  

**On your phone** (Wi‑Fi or mobile data): open that link → login.

Demo login: `9123456789` / `demo123`

Keep the PC terminal **open** while you use the app.

---

## Two terminals (alternative)

**Terminal 1:**

```powershell
npm run dev:mobile
```

**Terminal 2:**

```powershell
npm run tunnel
```

Copy the `https://...` URL from terminal 2.

---

## Login page

After the tunnel is running, the customer/shop login pages show a green **“Phone link (any Wi‑Fi / mobile data)”** box with **Copy link**.

---

## loca.lt password

If the browser asks for a tunnel password, enter your PC’s **public IP**:

- Open https://ifconfig.me on the PC  
- Paste that IP as the password  

---

## APK (optional)

The tunnel URL changes each time unless you use a fixed host. For a stable APK, deploy to a real domain and set:

```env
CAPACITOR_SERVER_URL=https://your-domain.com
```

Then `npm run build:apk`.

---

## Production (no tunnel)

Deploy the app (Vercel, VPS, etc.) and use one permanent URL — no PC and no tunnel needed.
