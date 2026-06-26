// src/app/(dashboard)/documents/[id]/edit/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { serverFetch } from "@/lib/server-fetch";
import EditDocumentForm from "./EditDocumentForm";

interface DocData {
  id: string;
  title: string;
  description: string;
  status: string;
  owner?: { id?: string };
}

async function getDocument(id: string): Promise<DocData | null> {
  try {
    const res = await serverFetch(`/api/documents/${id}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function EditDocumentPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");

  const document = await getDocument(params.id);

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 text-center shadow-sm">
          <p className="text-gray-600">Documento não encontrado ou o servidor back-end não está disponível.</p>
          <Link href="/documents" className="mt-4 inline-block text-blue-600 hover:underline">
            Voltar para a lista
          </Link>
        </div>
      </div>
    );
  }

  // AppSec: RBAC — só o dono (ou admin) edita, e somente em RASCUNHO.
  const isAdmin = session.user.role === "ADMINISTRADOR";
  const isOwner = document.owner?.id === session.user.id;
  const canEdit = document.status === "RASCUNHO" && (isOwner || isAdmin);

  // Sem permissão → volta para o detalhe (o back-end também bloqueia com 403).
  if (!canEdit) {
    redirect(`/documents/${params.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-sm text-gray-500">
          <Link href={`/documents/${document.id}`} className="hover:text-gray-700">
            ← Voltar para o documento
          </Link>
        </div>
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Editar documento</h1>
        <p className="mb-6 text-sm text-gray-500">A edição gera uma nova versão do documento.</p>

        <EditDocumentForm
          id={document.id}
          initialTitle={document.title}
          initialDescription={document.description}
        />
      </div>
    </div>
  );
}
