/** Google OAuth 2.0 authorization-code flow with PKCE (no extra dependency). */
import { createHash, randomBytes } from "node:crypto";

export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const frontend = String(process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${frontend}/api/auth/google/callback`;
  return { clientId, clientSecret, redirectUri };
}

export const isGoogleConfigured = () => {
  const { clientId, clientSecret } = googleConfig();
  return Boolean(clientId && clientSecret);
};

const base64url = (value: Buffer) =>
  value.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function googlePkce() {
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export function newState(): string {
  return randomBytes(16).toString("hex");
}

export function googleAuthorizeUrl(state: string, codeChallenge: string): string {
  const { clientId, redirectUri } = googleConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export type GoogleProfile = {
  sub: string;
  email: string;
  name: string;
  emailVerified: boolean;
};

export async function exchangeGoogleCode(
  code: string,
  codeVerifier: string
): Promise<GoogleProfile | null> {
  const { clientId, clientSecret, redirectUri } = googleConfig();
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }).toString(),
  });
  if (!tokenRes.ok) return null;
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) return null;

  const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!infoRes.ok) return null;
  const info = (await infoRes.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    email_verified?: boolean;
  };
  if (!info.sub || !info.email) return null;
  return {
    sub: info.sub,
    email: String(info.email).toLowerCase(),
    name: String(info.name || info.email.split("@")[0]),
    emailVerified: info.email_verified === true,
  };
}
