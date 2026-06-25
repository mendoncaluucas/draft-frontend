"use server"

import { serverFetch } from "@/lib/server-fetch"
import { revalidatePath } from "next/cache"

export async function submitDocument(formData: FormData) {
  const id = formData.get("documentId") as string
  await serverFetch(`/api/documents/${id}/submit`, { method: "PATCH" })
  revalidatePath(`/documents/${id}`)
}

export async function approveDocument(formData: FormData) {
  const id = formData.get("documentId") as string
  await serverFetch(`/api/documents/${id}/approve`, { method: "PATCH" })
  revalidatePath(`/documents/${id}`)
}

export async function rejectDocument(formData: FormData) {
  const id = formData.get("documentId") as string
  const reason = formData.get("reason") as string
  await serverFetch(`/api/documents/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  })
  revalidatePath(`/documents/${id}`)
}
