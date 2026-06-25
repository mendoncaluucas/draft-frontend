"use client"

import { signOut } from "next-auth/react"

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full rounded px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
    >
      Sair do sistema
    </button>
  )
}
