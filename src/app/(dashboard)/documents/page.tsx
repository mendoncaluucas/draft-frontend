// src/app/(dashboard)/documents/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { serverFetch } from "@/lib/server-fetch";

export default async function DocumentsPage() {
  // AppSec: Validação de sessão no servidor.
  const session = await auth();

  // Se não tiver sessão válida, chuta o usuário de volta pro login
  if (!session) {
    redirect("/login");
  }

  // AppSec: busca os documentos via serverFetch — o token de sessão é lido do
  // cookie httpOnly no servidor e injetado como Bearer, nunca exposto ao cliente.
  let documents: { id: string; title: string; status: string; currentVersion: number; owner?: { name?: string } }[] = [];
  try {
    const response = await serverFetch("/api/documents");
    if (response.ok) {
      const json = await response.json();
      documents = json.data || [];
    } else {
      console.error("Erro ao buscar documentos:", response.status);
    }
  } catch (error) {
    console.error("Erro de conexão com o Back-end:", error);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-800">Meus Documentos</h1>
        
        {/* Caixa de Sessão */}
        <div className="mt-6 rounded-md bg-blue-50 p-4 border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-800">Sessão Ativa (NextAuth v5)</h2>
          <p className="mt-2 text-gray-700">Bem-vindo(a), <strong>{session.user?.name}</strong>!</p>
          <p className="text-gray-700">E-mail: {session.user?.email}</p>
          <p className="text-gray-700">
            Perfil de Acesso: <span className="rounded bg-blue-200 px-2 py-1 text-sm font-bold text-blue-900">{session.user?.role}</span>
          </p>
        </div>

        {/* Listagem de Documentos Reais */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Lista de Documentos</h2>
          
          {documents.length === 0 ? (
            <div className="rounded-md bg-gray-50 p-8 text-center border border-gray-200">
              <p className="text-gray-500">Nenhum documento encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-900">Título</th>
                    <th className="px-6 py-4 font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-900">Versão</th>
                    <th className="px-6 py-4 font-semibold text-gray-900">Autor</th>
                    <th className="px-6 py-4 font-semibold text-gray-900 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        <Link href={`/documents/${doc.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                          {doc.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">v{doc.currentVersion}</td>
                      <td className="px-6 py-4 text-gray-600">{doc.owner?.name || "Desconhecido"}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                        >
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}