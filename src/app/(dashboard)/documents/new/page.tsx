// src/app/(dashboard)/documents/new/page.tsx
//
// AppSec — Henrique (Front-end · Área do Colaborador)
// ====================================================
// Responsabilidades desta página:
//   1. Formulário de criação de contratos/termos fictícios
//   2. Submit via Server Action (createDocument) — o token de sessão fica
//      SOMENTE no servidor (cookie httpOnly via serverFetch), nunca exposto
//      ao JavaScript do cliente
//   3. Erros 400 do Zod são desestruturados e exibidos campo a campo

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NewDocumentForm from "./NewDocumentForm";

// Server Component: valida sessão e extrai o JWT de forma segura no servidor
export default async function NewDocumentPage() {
  const session = await auth();

  // Se não autenticado, redireciona para login
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10">
      <div className="mx-auto max-w-2xl">
        {/* Cabeçalho */}
        <div className="mb-8">
          <a
            href="/documents"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para documentos
          </a>
          <h1 className="text-2xl font-bold text-gray-900">Novo documento</h1>
          <p className="mt-1 text-sm text-gray-500">
            Preencha os campos abaixo para criar um contrato ou termo fictício.
          </p>
        </div>

        {/* Client Component: submete via Server Action (token só no servidor) */}
        <NewDocumentForm
          userName={session.user?.name ?? ""}
          userRole={session.user?.role ?? ""}
        />
      </div>
    </div>
  );
}
