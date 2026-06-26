// src/app/(dashboard)/documents/[id]/edit/EditDocumentForm.tsx
// CLIENT COMPONENT — envia por Server Action (token só no servidor).
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateDocument } from "./actions";

interface EditDocumentFormProps {
  id: string;
  initialTitle: string;
  initialDescription: string;
}

export default function EditDocumentForm({
  id,
  initialTitle,
  initialDescription,
}: EditDocumentFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await updateDocument(id, {
        title: title.trim(),
        description: description.trim(),
      });

      if (result.ok) {
        router.push(`/documents/${id}`);
        router.refresh();
        return;
      }

      if (result.status === 400) {
        setError("Verifique os campos: título (mín. 3) e descrição (mín. 5 caracteres).");
      } else if (result.status === 403) {
        setError("Você não tem permissão para editar este documento.");
      } else if (result.status === 401) {
        setError("Sua sessão expirou. Faça login novamente.");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError("Não foi possível salvar as alterações. Tente novamente.");
      }
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg bg-white p-6 shadow-sm">
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Título
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Descrição
        </label>
        <textarea
          id="description"
          rows={8}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Salvando..." : "Salvar alterações"}
        </button>
        <a
          href={`/documents/${id}`}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
