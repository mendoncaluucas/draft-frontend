import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { serverFetch } from "@/lib/server-fetch"
import type { Document, DocumentStatus } from "@/types"
import { submitDocument, approveDocument, rejectDocument } from "./actions"

const STATUS_LABELS: Record<DocumentStatus, string> = {
  RASCUNHO: "Rascunho",
  EM_REVISAO: "Em Revisão",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
}

const STATUS_COLORS: Record<DocumentStatus, string> = {
  RASCUNHO: "bg-gray-100 text-gray-700",
  EM_REVISAO: "bg-yellow-100 text-yellow-800",
  APROVADO: "bg-green-100 text-green-800",
  REJEITADO: "bg-red-100 text-red-800",
}

async function getDocument(id: string): Promise<Document | null> {
  try {
    const res = await serverFetch(`/api/documents/${id}`)
    if (!res.ok) return null
    const json = await res.json()
    return json.data ?? null
  } catch {
    return null
  }
}

export default async function DocumentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const document = await getDocument(params.id)

  const role = session.user.role
  const userId = session.user.id

  // AppSec: RBAC visual — só renderiza ações que o perfil tem permissão de executar
  const isAnalista = role === "ANALISTA"
  const isAdmin = role === "ADMINISTRADOR"
  const isColaborador = role === "COLABORADOR"
  const isOwner = document?.owner?.id === userId

  const canSubmit =
    document?.status === "RASCUNHO" && (isColaborador || isAdmin) && (isOwner || isAdmin)
  const canApproveOrReject =
    document?.status === "EM_REVISAO" && (isAnalista || isAdmin)
  const canEdit =
    document?.status === "RASCUNHO" && (isOwner || isAdmin)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500">
          <Link href="/documents" className="hover:text-gray-700">
            Documentos
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800">{document?.title ?? "Detalhe"}</span>
        </div>

        {!document ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-sm">
            <p className="text-gray-500">
              Documento não encontrado ou o servidor back-end não está disponível.
            </p>
            <Link
              href="/documents"
              className="mt-4 inline-block text-sm text-blue-600 hover:underline"
            >
              Voltar para a lista
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{document.title}</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Criado por <strong>{document.owner.name}</strong> •{" "}
                    {new Date(document.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${STATUS_COLORS[document.status]}`}
                >
                  {STATUS_LABELS[document.status]}
                </span>
              </div>

              {document.description && (
                <p className="mt-4 text-gray-600">{document.description}</p>
              )}

              {document.assignedTo && (
                <p className="mt-2 text-sm text-gray-500">
                  Atribuído a: <strong>{document.assignedTo.name}</strong>
                </p>
              )}
            </div>

            {/* Conteúdo da versão atual */}
            {document.versions && document.versions.length > 0 && (
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-3 font-semibold text-gray-800">
                  Versão atual (v{document.currentVersion})
                </h2>
                <div className="whitespace-pre-wrap rounded-md bg-gray-50 p-4 font-mono text-sm text-gray-700">
                  {document.versions[document.versions.length - 1]?.content}
                </div>
              </div>
            )}

            {/* AppSec: Ações — renderização condicional por perfil (RBAC visual) */}
            {(canSubmit || canApproveOrReject || canEdit) && (
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-semibold text-gray-800">Ações</h2>

                <div className="flex flex-wrap gap-3">
                  {canEdit && (
                    <Link
                      href={`/documents/${document.id}/edit`}
                      className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-900"
                    >
                      Editar documento
                    </Link>
                  )}

                  {canSubmit && (
                    <form action={submitDocument}>
                      <input type="hidden" name="documentId" value={document.id} />
                      <button
                        type="submit"
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        Submeter para revisão
                      </button>
                    </form>
                  )}

                  {/* AppSec RBAC: botões Aprovar e Rejeitar só para ANALISTA (e ADMINISTRADOR) */}
                  {canApproveOrReject && (
                    <>
                      <form action={approveDocument}>
                        <input type="hidden" name="documentId" value={document.id} />
                        <button
                          type="submit"
                          className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                        >
                          Aprovar
                        </button>
                      </form>
                    </>
                  )}
                </div>

                {/* Formulário de rejeição separado para forçar o motivo */}
                {canApproveOrReject && (
                  <form action={rejectDocument} className="mt-4 border-t pt-4">
                    <input type="hidden" name="documentId" value={document.id} />
                    <label className="block text-sm font-medium text-gray-700">
                      Motivo da rejeição
                    </label>
                    <textarea
                      name="reason"
                      required
                      rows={3}
                      placeholder="Descreva o motivo da rejeição..."
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                    />
                    <button
                      type="submit"
                      className="mt-2 rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                    >
                      Rejeitar documento
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Histórico de versões */}
            {document.versions && document.versions.length > 0 && (
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-semibold text-gray-800">Histórico de versões</h2>
                <div className="space-y-3">
                  {[...document.versions]
                    .sort((a, b) => b.versionNumber - a.versionNumber)
                    .map((version) => (
                      <div
                        key={version.id}
                        className="rounded-md border border-gray-100 bg-gray-50 p-4"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-gray-700">
                            v{version.versionNumber}
                          </span>
                          <span className="text-gray-500">
                            {version.createdBy?.name} •{" "}
                            {new Date(version.createdAt).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap font-mono text-xs text-gray-600">
                          {version.content.slice(0, 200)}
                          {version.content.length > 200 ? "…" : ""}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
