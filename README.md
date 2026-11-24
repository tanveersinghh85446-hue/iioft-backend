# IIOFT Backend

Website ke Apply / Contact forms ki enquiries client ke **email** pe bhejne wala backend.
Stack: Node.js + Express + Nodemailer.

## 1. Setup (ek baar)

```bash
cd IIOFT-BACKEND
npm install
```

`.env.example` ko copy karke **`.env`** naam se banao aur values bharo:

```
MAIL_USER=clientemail@gmail.com      # jisse mail bheji jayegi
MAIL_PASS=xxxx xxxx xxxx xxxx        # Gmail App Password (niche dekho)
MAIL_TO=clientemail@gmail.com        # jis email pe enquiries aani hain
```

### Gmail App Password kaise banate hain

1. Client ke Gmail me **2-Step Verification** ON karo.
2. https://myaccount.google.com/apppasswords kholo.
3. Koi bhi naam do (jaise "IIOFT Website") aur **Create** dabao.
4. Jo 16 letters ka password mile wo `MAIL_PASS` me daalo. (Normal Gmail password kaam nahi karega.)

### Domain email (jaise info@iioft.co.in) ho to

Hosting wale se SMTP details lo aur `.env` me daalo:

```
SMTP_HOST=mail.iioft.co.in
SMTP_PORT=465
MAIL_USER=info@iioft.co.in
MAIL_PASS=email-ka-password
```

## 2. Chalana

```bash
npm run dev     # development (auto restart)
npm start       # production
```

Browser me http://localhost:5000/api/health kholo, `{"ok":true}` dikhna chahiye.

### Mail bheje bina test karna

`.env` me `MAIL_DRY_RUN=true` kar do. Mail nahi jayegi, bas terminal me print hogi.

## 3. API

**POST** `/api/send-enquiry`

```json
{
  "name": "Rahul",
  "phone": "9876543210",
  "email": "rahul@gmail.com",
  "course": "Python with AI",
  "qualification": "Graduation",
  "city": "Delhi",
  "topic": "Admission",
  "message": "Fees batao",
  "source": "Contact Page"
}
```

Zaroori sirf `name` aur `phone` (10 digit) hain, baaki optional.
Success: `{ "ok": true }`. Error: `{ "ok": false, "error": "..." }`.

Security built-in: CORS (sirf tumhari site), rate limit (5 requests / 15 min / IP),
spam-bot honeypot, HTML escape, helmet.

## 4. Frontend (React) se jodna

Frontend project me `.env` file banao (`f/.env`):

```
VITE_API_URL=http://localhost:5000
```

Naya file `src/sendEnquiry.js`:

```js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function sendEnquiry(data) {
  const res = await fetch(`${API_URL}/api/send-enquiry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.error || "Failed to send");
  return json;
}
```

`Contact.jsx` / `Apply.jsx` me import karo aur `handleSubmit` me `window.open(...)` ke baad ye line daalo:

```jsx
import { sendEnquiry } from "../sendEnquiry";
// ...
sendEnquiry({ ...form, source: "Contact Page" }).catch(() => {});
```

(Apply page me `source: "Apply Page"`.)

## 5. Live (deploy) karna

Backend ko **Render.com** (free) ya **Railway** pe daal sakte ho:

1. Is folder ko GitHub pe push karo (`.env` push mat karna, wo `.gitignore` me hai).
2. Render me **New > Web Service** > repo chuno.
3. Build Command: `npm install`, Start Command: `npm start`.
4. **Environment** me `.env` wali saari values daalo (`MAIL_USER`, `MAIL_PASS`, `MAIL_TO`, `ALLOWED_ORIGINS`).
5. Deploy hone par URL milega (jaise `https://iioft-backend.onrender.com`).
6. Frontend ke Vercel project me env variable daalo: `VITE_API_URL = https://iioft-backend.onrender.com` aur frontend ko redeploy karo.

Note: Render ka free plan kuch der idle rehne par so jata hai, to pehli request 30-50 second le sakti hai.

## Folder structure

```
IIOFT-BACKEND/
  server.js          # Express server, CORS, rate limit
  src/enquiry.js     # /api/send-enquiry route
  src/mailer.js      # Gmail / SMTP setup
  .env.example       # settings ka sample
  package.json
```
