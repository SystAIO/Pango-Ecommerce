/**
 * Transactional email via Gmail SMTP.
 *
 * Configure GMAIL_USER and GMAIL_APP_PASSWORD (a Gmail app password, not the
 * account password) in backend/.env. Without them every send is a no-op, so a
 * fresh checkout never fails because mail is unconfigured.
 */

import nodemailer from "nodemailer";

const user = process.env.GMAIL_USER || process.env.EMAIL_USER || "";
const pass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_APP_PASSWORD || "";

export const isEmailConfigured = () => Boolean(user && pass);

function transport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

async function send(to: string, subject: string, text: string, html: string) {
  if (!isEmailConfigured() || !to) return;
  try {
    await transport().sendMail({ from: `"Pango Apparels" <${user}>`, to, subject, text, html });
  } catch (error) {
    console.error("Email send failed:", error instanceof Error ? error.message : error);
  }
}

const rupees = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

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
