"use client";

// src/app/(dashboard)/error.tsx
// AppSec: Tratamento de erros. Mostra mensagem amigável sem expor stack trace ao usuário.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Algo deu errado</h1>
        <p className="mt-2 text-gray-600">
          Ocorreu um erro inesperado ao processar sua solicitação. A equipe foi notificada.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-gray-400">Ref: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-6 rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-gray-900"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
