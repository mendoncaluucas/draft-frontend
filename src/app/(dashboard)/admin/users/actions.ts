"use server"

import { serverFetch } from "@/lib/server-fetch"
import { revalidatePath } from "next/cache"

export async function createUser(formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as string,
  }

  const res = await serverFetch("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error ?? "Falha ao criar usuário")
  }

  revalidatePath("/admin/users")
}

export async function deleteUser(formData: FormData) {
  const id = formData.get("userId") as string
  await serverFetch(`/api/admin/users/${id}`, { method: "DELETE" })
  revalidatePath("/admin/users")
}

export async function updateUserRole(formData: FormData) {
  const id = formData.get("userId") as string
  const role = formData.get("role") as string

  const res = await serverFetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  })

  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error ?? "Falha ao alterar o perfil")
  }

  revalidatePath("/admin/users")
}
