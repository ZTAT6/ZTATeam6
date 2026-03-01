import crypto from "crypto";
import nodemailer from "nodemailer";
// Ghi chú: File này quản lý việc tạo mã OTP và gửi email xác thực/đường dẫn xác nhận đăng nhập.
// Cấu hình cần thiết (biến môi trường):
// - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM: dùng để gửi email thật.
// - APP_BASE_URL: dùng để tạo URL xác nhận đăng nhập (/auth/confirm-login?token=...).
// Trong môi trường dev, nếu thiếu SMTP_* sẽ log mã/URL ra console thay vì gửi email thật.

// Helper: thay thế {{tên_biến}} trong template bằng giá trị cung cấp
function interpolate(template, vars) {
  if (!template) return undefined;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const val = vars[key];
    return val === undefined || val === null ? "" : String(val);
  });
}

// Send OTP via SMS using Twilio REST API if configured
export async function sendVerificationSMS({ to, code }) {
  // Gửi OTP qua SMS (Twilio); trong hệ thống hiện tại kênh SMS bị vô hiệu trong đăng ký.
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
  // Tạo mã OTP 6 chữ số (numeric)
  return (Math.floor(100000 + Math.random() * 900000)).toString();
}

export async function sendVerificationEmail({ to, code, subject, text, html }) {
  // Gửi email chứa mã OTP xác thực (đăng ký, gửi lại mã, quên mật khẩu)
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

  // Cho phép tuỳ biến nội dung qua tham số hoặc biến môi trường
  const subjectFinal = subject || process.env.EMAIL_VERIFY_SUBJECT || "EduLearn Pro - Mã xác thực";
  const textFinal =
    text ||
    interpolate(process.env.EMAIL_VERIFY_TEXT, { code }) ||
    `Mã xác thực của bạn là: ${code}. Mã sẽ hết hạn sau 15 phút.`;
  const htmlFinal =
    html ||
    interpolate(process.env.EMAIL_VERIFY_HTML, { code }) ||
    `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto;max-width:520px;margin:auto;padding:16px;border:1px solid #e5e7eb;border-radius:12px">
       <h2 style="margin:0 0 12px">EduLearn Pro</h2>
       <p style="margin:0 0 8px">Mã xác thực của bạn:</p>
       <p style="font-size:22px;font-weight:700;letter-spacing:2px;margin:0 0 12px">${code}</p>
       <p style="color:#374151;margin:0">Mã sẽ hết hạn sau <strong>15 phút</strong>. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
     </div>`;

  const info = await transporter.sendMail({ from, to, subject: subjectFinal, text: textFinal, html: htmlFinal });
  return { messageId: info.messageId };
}

export async function sendLoginConfirmationEmail({ to, token, subject, text, html }) {
  // Gửi email chứa link xác nhận đăng nhập cho student đăng nhập lặp lại
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

  // Tuỳ biến nội dung login confirmation qua tham số hoặc biến môi trường
  const subjectFinal = subject || process.env.EMAIL_LOGIN_SUBJECT || "EduLearn Pro - Xác nhận đăng nhập";
  const textFinal =
    text ||
    interpolate(process.env.EMAIL_LOGIN_TEXT, { link }) ||
    `Vui lòng xác nhận đăng nhập bằng liên kết: ${link}. Liên kết sẽ hết hạn sau 10 phút.`;
  const htmlFinal =
    html ||
    interpolate(process.env.EMAIL_LOGIN_HTML, { link }) ||
    `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto;max-width:520px;margin:auto;padding:16px;border:1px solid #e5e7eb;border-radius:12px">
       <h2 style="margin:0 0 12px">EduLearn Pro</h2>
       <p style="margin:0 0 12px">Nhấn nút bên dưới để xác nhận đăng nhập. Liên kết sẽ hết hạn sau <strong>10 phút</strong>.</p>
       <p style="margin:0"><a href="${link}" style="display:inline-block;padding:10px 16px;background:#0e6de6;color:#fff;border-radius:8px;text-decoration:none">Xác nhận đăng nhập</a></p>
     </div>`;

  const info = await transporter.sendMail({ from, to, subject: subjectFinal, text: textFinal, html: htmlFinal });
  return { messageId: info.messageId };
}