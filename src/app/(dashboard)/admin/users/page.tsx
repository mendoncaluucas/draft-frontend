import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { serverFetch } from "@/lib/server-fetch"
import type { User } from "@/types"
import { createUser, deleteUser, updateUserRole } from "./actions"

const ROLE_LABELS: Record<string, string> = {
  COLABORADOR: "Colaborador",
  ANALISTA: "Analista",
  ADMINISTRADOR: "Administrador",
}

const ROLE_COLORS: Record<string, string> = {
  COLABORADOR: "bg-gray-100 text-gray-700",
  ANALISTA: "bg-blue-100 text-blue-700",
  ADMINISTRADOR: "bg-purple-100 text-purple-700",
}

async function getUsers(): Promise<User[]> {
  try {
    const res = await serverFetch("/api/admin/users")
    if (!res.ok) return []
    const json = await res.json()
    return json.data ?? []
  } catch {
    return []
  }
}

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session) redirect("/login")

  // AppSec: Autorização por perfil — apenas ADMINISTRADOR acessa esta rota
  if (session.user.role !== "ADMINISTRADOR") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <p className="text-2xl font-bold text-red-600">403</p>
          <p className="mt-2 text-gray-600">Acesso negado.</p>
          <p className="mt-1 text-sm text-gray-500">
            Apenas administradores podem gerenciar usuários.
          </p>
        </div>
      </div>
    )
  }

  const users = await getUsers()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gerenciamento de Usuários</h1>
          <p className="mt-1 text-sm text-gray-500">
            {users.length} usuário{users.length !== 1 ? "s" : ""} cadastrado
            {users.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Listagem de usuários */}
        <div className="rounded-lg bg-white shadow-sm">
          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum usuário encontrado. O servidor back-end pode não estar disponível.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">E-mail</th>
                  <th className="px-6 py-3">Perfil</th>
                  <th className="px-6 py-3">Cadastrado em</th>
                  <th className="px-6 py-3">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {user.name}
                      {user.id === session.user.id && (
                        <span className="ml-2 text-xs text-gray-400">(você)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4">
                      {user.id !== session.user.id ? (
                        <div className="flex items-center gap-4">
                          {/* Editar perfil (RBAC: só ADMIN chega aqui; o back também valida) */}
                          <form action={updateUserRole} className="flex items-center gap-1.5">
                            <input type="hidden" name="userId" value={user.id} />
                            <select
                              name="role"
                              defaultValue={user.role}
                              className="rounded-md border px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:outline-none"
                            >
                              <option value="COLABORADOR">Colaborador</option>
                              <option value="ANALISTA">Analista</option>
                              <option value="ADMINISTRADOR">Administrador</option>
                            </select>
                            <button
                              type="submit"
                              className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              Salvar
                            </button>
                          </form>
                          <form action={deleteUser}>
                            <input type="hidden" name="userId" value={user.id} />
                            <button
                              type="submit"
                              className="text-xs text-red-600 hover:text-red-800 hover:underline"
                            >
                              Remover
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Formulário de criação de usuário */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">Criar novo usuário</h2>
          <form action={createUser} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome completo</label>
              <input
                name="name"
                type="text"
                required
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Ex: Maria Souza"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">E-mail</label>
              <input
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="usuario@empresa.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Senha inicial</label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Perfil de acesso</label>
              <select
                name="role"
                required
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="COLABORADOR">Colaborador</option>
                <option value="ANALISTA">Analista</option>
                <option value="ADMINISTRADOR">Administrador</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-md bg-gray-800 px-5 py-2 text-sm text-white hover:bg-gray-900"
              >
                Criar usuário
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
