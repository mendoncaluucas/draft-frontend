// src/app/(dashboard)/documents/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DocumentsPage() {
  // AppSec: Validação de sessão no servidor. O JWT nunca vai para o JS do cliente.
  const session = await auth();

  // Se não tiver sessão válida, chuta o usuário de volta pro login
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-800">Meus Documentos</h1>
        
        <div className="mt-6 rounded-md bg-blue-50 p-4 border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-800">Sessão Ativa (NextAuth v5)</h2>
          <p className="mt-2 text-gray-700">Bem-vindo(a), <strong>{session.user?.name}</strong>!</p>
          <p className="text-gray-700">E-mail: {session.user?.email}</p>
          <p className="text-gray-700">
            Perfil de Acesso: <span className="rounded bg-blue-200 px-2 py-1 text-sm font-bold text-blue-900">{session.user?.role}</span>
          </p>
        </div>

        <p className="mt-6 text-gray-600">
          A listagem de documentos (mock data) da Seção 13 ficará aqui[cite: 215].
        </p>
      </div>
    </div>
  );
}