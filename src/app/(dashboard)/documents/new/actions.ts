// src/app/(dashboard)/documents/new/actions.ts
"use server";

import { serverFetch } from "@/lib/server-fetch";

// AppSec: a criação roda no servidor (Server Action). O token de sessão é lido
// do cookie httpOnly pelo serverFetch e injetado como Bearer — NUNCA é exposto
// ao JavaScript do cliente.
export async function createDocument(payload: {
  title: string;
  description: string;
  type?: string;
  content?: string;
  parties?: string;
  effectiveDate?: string;
  expirationDate?: string;
}) {
  const res = await serverFetch("/api/documents", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  return { status: res.status, ok: res.ok, body };
}
