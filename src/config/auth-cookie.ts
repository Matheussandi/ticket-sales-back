import type { CookieOptions } from "express";

/** Alinhado a `expiresIn: "1h"` do JWT em AuthService. */
const JWT_EXPIRY_MS = 60 * 60 * 1000;

function parseSameSite(): NonNullable<CookieOptions["sameSite"]> {
  const raw = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();
  if (raw === "strict" || raw === "lax" || raw === "none") {
    return raw;
  }
  return "lax";
}

export function authCookieName(): string {
  return process.env.JWT_COOKIE_NAME || "access_token";
}

export function getAuthCookieOptions(): CookieOptions {
  const secure =
    process.env.COOKIE_SECURE === "true" || process.env.COOKIE_SECURE === "1";
  return {
    httpOnly: true,
    path: "/",
    maxAge: JWT_EXPIRY_MS,
    sameSite: parseSameSite(),
    secure,
  };
}

/** Opções para `clearCookie` (devem coincidir com as do `set`). */
export function getAuthClearCookieOptions(): Pick<
  CookieOptions,
  "path" | "sameSite" | "secure"
> {
  const { path, sameSite, secure } = getAuthCookieOptions();
  return { path, sameSite, secure };
}
