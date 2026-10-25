import { NextResponse } from "next/server";
import { cookieSecure, SESSION_COOKIE } from "./session";

export function problem(status: number, title: string, detail?: string, headers?: HeadersInit) {
  return NextResponse.json(
    { title, status, ...(detail ? { detail } : {}) },
    {
      status,
      headers: {
        "content-type": "application/problem+json",
        "cache-control": "no-store",
        ...headers,
      },
    },
  );
}

/** URL interna de la API (solo servidor). */
export function apiBase(): string | null {
  const base = process.env.API_URL;
  return base ? base.replace(/\/$/, "") : null;
}

export function setSessionCookie(response: NextResponse, token: string, expires: Date) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
