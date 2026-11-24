import { Router } from "express";
import { sendMail } from "./mailer.js";

const router = Router();

const escapeHtml = (s = "") =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

// Header injection se bachne ke liye new lines hata do
const oneLine = (s = "", max = 80) =>
  String(s)
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, max);

const isEmail = (s = "") => /^\S+@\S+\.\S+$/.test(s);

router.post("/send-enquiry", async (req, res) => {
  const {
    name,
    phone,
    email,
    course,
    qualification,
    city,
    topic,
    message,
    source,
    website, // honeypot (hidden field) - bots bhar dete hain
  } = req.body || {};

  // Bot pakda gaya: chupchap success dikha do, mail mat bhejo
  if (website) return res.status(200).json({ ok: true });

  const cleanPhone = String(phone || "").replace(/[\s-]/g, "");
  if (!name || !String(name).trim()) {
    return res.status(400).json({ ok: false, error: "Name is required" });
  }
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return res
      .status(400)
      .json({ ok: false, error: "Enter a valid 10-digit mobile number" });
  }
  if (email && !isEmail(email)) {
    return res.status(400).json({ ok: false, error: "Invalid email address" });
  }

  const rows = [
    ["Source", source || "Website"],
    ["Topic", topic],
    ["Name", name],
    ["Phone", cleanPhone],
    ["Email", email],
    ["Course", course],
    ["Qualification", qualification],
    ["City", city],
    ["Message", message],
  ].filter(([, v]) => v && String(v).trim());

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px">
      <h2 style="color:#1d4ed8;margin-bottom:12px">New enquiry from IIOFT website</h2>
      <table style="border-collapse:collapse;width:100%;border:1px solid #e2e8f0">
        ${rows
          .map(
            ([k, v]) => `
          <tr>
            <td style="padding:8px 12px;font-weight:bold;background:#f1f5f9;width:140px">${k}</td>
            <td style="padding:8px 12px">${escapeHtml(String(v).slice(0, 2000))}</td>
          </tr>`,
          )
          .join("")}
      </table>
      <p style="color:#64748b;font-size:12px;margin-top:14px">
        Received: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} (IST)
      </p>
    </div>`;

  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  try {
    await sendMail({
      to: process.env.MAIL_TO || process.env.MAIL_USER,
      replyTo: isEmail(email) ? email : undefined,
      subject: `New ${oneLine(source || "Enquiry", 30)} - ${oneLine(name, 60)}`,
      html,
      text,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Mail error:", err.message);
    return res
      .status(500)
      .json({ ok: false, error: "Could not send email. Please try again." });
  }
});

export default router;
