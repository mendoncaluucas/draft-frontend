import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import LogoutButton from "@/components/LogoutButton"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const isAdmin = session.user.role === "ADMINISTRADOR"

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-60 flex-col bg-gray-800 text-white">
        <div className="border-b border-gray-700 p-5">
          <h1 className="text-lg font-bold tracking-wide">Draft</h1>
          <p className="mt-1 truncate text-sm text-gray-400">{session.user.name}</p>
          <span className="mt-1 inline-block rounded bg-blue-700 px-2 py-0.5 text-xs font-semibold">
            {session.user.role}
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          <Link
            href="/documents"
            className="block rounded px-3 py-2 text-sm hover:bg-gray-700 transition-colors"
          >
            Documentos
          </Link>
          <Link
            href="/documents/new"
            className="block rounded px-3 py-2 text-sm hover:bg-gray-700 transition-colors"
          >
            Novo documento
          </Link>

          {isAdmin && (
            <>
              <div className="mt-4 px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Administração
              </div>
              <Link
                href="/admin/users"
                className="block rounded px-3 py-2 text-sm hover:bg-gray-700 transition-colors"
              >
                Usuários
              </Link>
              <Link
                href="/admin/logs"
                className="block rounded px-3 py-2 text-sm hover:bg-gray-700 transition-colors"
              >
                Logs de auditoria
              </Link>
            </>
          )}
        </nav>

        <div className="border-t border-gray-700 p-3">
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
