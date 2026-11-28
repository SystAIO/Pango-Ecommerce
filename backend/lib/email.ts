/**
 * Transactional email. Brevo (HTTP API) is preferred; Gmail SMTP is kept as a
 * fallback. Without keys every send is a no-op, so a fresh checkout never
 * fails because mail is unconfigured.
 */

import nodemailer from "nodemailer";

const user = process.env.GMAIL_USER || process.env.EMAIL_USER || "";
const pass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_APP_PASSWORD || "";
const brevoKey = process.env.BREVO_API_KEY || "";
const brevoSender = process.env.BREVO_SENDER_EMAIL || user;
const brevoName = process.env.BREVO_SENDER_NAME || "Pango Apparels";

export const isEmailConfigured = () => Boolean(brevoKey && brevoSender) || Boolean(user && pass);

async function send(to: string, subject: string, text: string, html: string): Promise<boolean> {
  if (!isEmailConfigured() || !to) return false;
  try {
    if (brevoKey && brevoSender) {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": brevoKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: { name: brevoName, email: brevoSender },
          to: [{ email: to }],
          subject,
          textContent: text,
          htmlContent: html,
        }),
      });
      if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
      return true;
    }
    await nodemailer
      .createTransport({ service: "gmail", auth: { user, pass } })
      .sendMail({ from: `"Pango Apparels" <${user}>`, to, subject, text, html });
    return true;
  } catch (error) {
    console.error("Email send failed:", error instanceof Error ? error.message : error);
    return false;
  }
}

const rupees = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const siteUrl = () =>
  String(process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

export async function sendVerificationOtpEmail(to: string, name: string, otp: string) {
  return send(
    to,
    "Your Pango Apparels verification code",
    `Hi ${name}, your email verification code is ${otp}. It expires in 10 minutes.`,
    `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#fffdf9;border:1px solid #f1e6d2;border-radius:16px;padding:32px">
      <p style="margin:0;font-size:12px;font-weight:800;letter-spacing:.22em;color:#8a6d3b">PANGO APPARELS</p>
      <h2 style="margin:18px 0 8px;font-size:24px;color:#171512">Verify your email</h2>
      <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#4b443a">Hi ${name}, thanks for joining Pango Apparels. Enter the code below on the website to activate your account.</p>
      <div style="text-align:center;margin:24px 0">
        <span style="display:inline-block;background:#171512;color:#fff;font-size:30px;font-weight:800;letter-spacing:.35em;padding:14px 24px;border-radius:12px">${otp}</span>
      </div>
      <p style="margin:0;font-size:12px;color:#8a8172">This code expires in 10 minutes. If you did not create an account, ignore this email.</p>
    </div>`
  );
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const link = `${siteUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  return send(
    to,
    "Reset your Pango Apparels password",
    `Hi ${name}, reset your password: ${link}`,
    `<div style="font-family:Arial,sans-serif;max-width:600px">
      <h2>Reset your password</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password.</p>
      <p><a href="${link}" style="background:#ea580c;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Choose a new password</a></p>
      <p>This link expires in 1 hour. If you did not request it, ignore this email.</p>
    </div>`
  );
}

export async function sendOrderConfirmation(input: {
  to: string;
  name: string;
  orderNo: string;
  total: number;
  lines: { name: string; quantity: number }[];
}) {
  const items = input.lines.map((l) => `<li>${l.name} × ${l.quantity}</li>`).join("");
  await send(
    input.to,
    `Order ${input.orderNo} confirmed — Pango Apparels`,
    `Hi ${input.name}, your order ${input.orderNo} for ${rupees(input.total)} has been placed. We'll notify you when it ships.`,
    `<div style="font-family:Arial,sans-serif;max-width:600px">
      <h2>Order confirmed</h2>
      <p>Hi ${input.name},</p>
      <p>Thanks for shopping with Pango Apparels. Your order <b>${input.orderNo}</b> has been placed.</p>
      <ul>${items}</ul>
      <p><b>Total: ${rupees(input.total)}</b></p>
      <p>We'll email you again when your order ships.</p>
    </div>`
  );
}

export async function sendCancellationNotice(input: {
  to: string;
  name: string;
  orderNo: string;
  reason?: string;
  refunded?: boolean;
}) {
  const refundLine = input.refunded
    ? "Your refund has been initiated and will reach your original payment method in 5–7 working days."
    : "For cash-on-delivery orders there is nothing to refund.";
  await send(
    input.to,
    `Order ${input.orderNo} cancelled — Pango Apparels`,
    `Hi ${input.name}, your order ${input.orderNo} has been cancelled. ${refundLine}`,
    `<div style="font-family:Arial,sans-serif;max-width:600px">
      <h2>Order cancelled</h2>
      <p>Hi ${input.name},</p>
      <p>Your order <b>${input.orderNo}</b> has been cancelled${input.reason ? ` — ${input.reason}` : ""}.</p>
      <p>${refundLine}</p>
      <p>Questions? Just reply to this email.</p>
    </div>`
  );
}
