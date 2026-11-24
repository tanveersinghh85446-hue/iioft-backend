import nodemailer from "nodemailer";

// Teen tarike (is order me chalte hain):
// 1) MAIL_DRY_RUN=true  -> mail nahi jati, sirf terminal me print hoti hai
// 2) BREVO_API_KEY bhara ho -> Brevo HTTP API (Render free pe chalta hai)
// 3) warna SMTP / Gmail (sirf local ya paid hosting pe chalega)

const FROM_NAME = "IIOFT Website";
const fromEmail = () =>
  process.env.MAIL_FROM || process.env.MAIL_USER || "no-reply@iioft.co.in";

let smtpTransporter;
function getSmtp() {
  if (smtpTransporter) return smtpTransporter;
  const auth = { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS };

  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT) || 465;
    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth,
    });
  } else {
    smtpTransporter = nodemailer.createTransport({ service: "gmail", auth });
  }
  return smtpTransporter;
}

async function sendViaBrevo({ to, replyTo, subject, html, text }) {
  const body = {
    sender: { name: FROM_NAME, email: fromEmail() },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text,
  };
  if (replyTo) body.replyTo = { email: replyTo };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo ${res.status}: ${detail.slice(0, 300)}`);
  }
}

export async function sendMail({ to, replyTo, subject, html, text }) {
  if (process.env.MAIL_DRY_RUN === "true") {
    console.log("[DRY RUN] Mail ye jati:\n", { to, replyTo, subject, text });
    return;
  }

  if (process.env.BREVO_API_KEY) {
    return sendViaBrevo({ to, replyTo, subject, html, text });
  }

  return getSmtp().sendMail({
    from: `"${FROM_NAME}" <${fromEmail()}>`,
    to,
    replyTo,
    subject,
    html,
    text,
  });
}
