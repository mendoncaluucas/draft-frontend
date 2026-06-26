// src/app/(dashboard)/documents/[id]/edit/actions.ts
"use server";

import { serverFetch } from "@/lib/server-fetch";

// AppSec: a edição roda no servidor (Server Action). O token de sessão é lido
// do cookie httpOnly pelo serverFetch e injetado como Bearer — nunca exposto
// ao JavaScript do cliente. O back-end valida dono + status RASCUNHO.
export async function updateDocument(
  id: string,
  payload: { title: string; description: string }
) {
  const res = await serverFetch(`/api/documents/${id}`, {
    method: "PUT",
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
