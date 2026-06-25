import { cookies } from "next/headers"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

export async function serverFetch(path: string, options: RequestInit = {}) {
  const cookieStore = cookies()

  // NextAuth v5 usa "authjs.session-token"; v4 usava "next-auth.session-token"
  const token =
    cookieStore.get("authjs.session-token")?.value ??
    cookieStore.get("next-auth.session-token")?.value

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  })
}
