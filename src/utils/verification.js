import crypto from "crypto";
import nodemailer from "nodemailer";

// Send OTP via SMS using Twilio REST API if configured
export async function sendVerificationSMS({ to, code }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER; // e.g. "+1234567890"

  if (!sid || !token || !from) {
    console.log(`[dev] SMS verification code for ${to}: ${code}`);
    return { dev: true };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`;
  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: `Your verification code is: ${code}`,
  });

  // Use global fetch (Node >=18) to post to Twilio; otherwise, dev log above applies
  const authHeader = "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`SMS send failed: ${resp.status} ${text}`);
  }

  const data = await resp.json().catch(() => ({}));
  return { sid: data.sid };
}

export function generateCode() {
  // 6-digit numeric code
  return (Math.floor(100000 + Math.random() * 900000)).toString();
}

export async function sendVerificationEmail({ to, code }) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || "no-reply@example.com";

  if (!host || !user || !pass) {
    console.log(`[dev] Email verification code for ${to}: ${code}`);
    return { dev: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const info = await transporter.sendMail({
    from,
    to,
    subject: "Your verification code",
    text: `Your verification code is: ${code}`,
    html: `<p>Your verification code is: <strong>${code}</strong></p>`,
  });
  return { messageId: info.messageId };
}

export async function sendLoginConfirmationEmail({ to, token }) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || "no-reply@example.com";

  const link = `${process.env.APP_BASE_URL || 'http://localhost:4000'}/auth/confirm-login?token=${encodeURIComponent(token)}`;

  if (!host || !user || !pass) {
    console.log(`[dev] Login confirmation link for ${to}: ${link}`);
    return { dev: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const info = await transporter.sendMail({
    from,
    to,
    subject: "Confirm your login",
    text: `Confirm your login by clicking: ${link}`,
    html: `<p>Confirm your login by clicking the button below:</p>
           <p><a href="${link}" style="display:inline-block;padding:10px 16px;background:#0e6de6;color:#fff;border-radius:8px;text-decoration:none">Confirm Login</a></p>`,
  });
  return { messageId: info.messageId };
}