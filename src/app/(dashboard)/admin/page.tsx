import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function AdminPage() {
  const session = await auth()
  if (!session) redirect("/login")

  if (session.user.role !== "ADMINISTRADOR") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <p className="text-2xl font-bold text-red-600">403</p>
          <p className="mt-2 text-gray-600">Acesso negado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">Painel Administrativo</h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/admin/users"
            className="rounded-lg bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-gray-800">Usuários</h2>
            <p className="mt-1 text-sm text-gray-500">Gerencie os usuários do sistema</p>
          </Link>

          <Link
            href="/admin/logs"
            className="rounded-lg bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-gray-800">Logs de auditoria</h2>
            <p className="mt-1 text-sm text-gray-500">Visualize o histórico de ações</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
