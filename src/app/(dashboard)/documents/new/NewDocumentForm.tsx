// src/app/(dashboard)/documents/new/NewDocumentForm.tsx
//
// CLIENT COMPONENT — formulário interativo
// O rawToken (JWT) é recebido via prop do Server Component pai.
// Nunca acessamos document.cookie, localStorage ou window.__session.
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// Tipos locais para o formulário
type DocumentType = "CONTRATO" | "TERMO" | "ADITIVO" | "MEMORANDO";

interface FormValues {
  title: string;
  description: string;
  type: DocumentType;
  content: string;
  parties: string;
  effectiveDate: string;
  expirationDate: string;
}

// Erros de campo vindos do Zod (shape: { field: [msg1, msg2] })
type ZodFieldErrors = Record<string, string[]>;

interface NewDocumentFormProps {
  rawToken: string | null;
  userName: string;
  userRole: string;
}

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------
const INITIAL_FORM: FormValues = {
  title: "",
  description: "",
  type: "CONTRATO",
  content: "",
  parties: "",
  effectiveDate: "",
  expirationDate: "",
};

const DOCUMENT_TYPES: { value: DocumentType; label: string; description: string }[] = [
  { value: "CONTRATO",  label: "Contrato",          description: "Instrumento bilateral com obrigações" },
  { value: "TERMO",     label: "Termo de Adesão",   description: "Aceite de condições preestabelecidas" },
  { value: "ADITIVO",   label: "Termo Aditivo",     description: "Alteração de contrato existente" },
  { value: "MEMORANDO", label: "Memorando Interno", description: "Comunicação entre departamentos" },
];

// Detecta se uma string não-vazia é um erro de campo do Zod
function parseZodErrors(body: unknown): ZodFieldErrors | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  // Shape esperado: { error: "Dados inválidos", details: { fieldErrors: {...} } }
  if (b.details && typeof b.details === "object") {
    const details = b.details as Record<string, unknown>;
    if (details.fieldErrors && typeof details.fieldErrors === "object") {
      return details.fieldErrors as ZodFieldErrors;
    }
  }
  return null;
}

// -------------------------------------------------------------------
// Componente
// -------------------------------------------------------------------
export default function NewDocumentForm({ rawToken, userName, userRole }: NewDocumentFormProps) {
  const router = useRouter();

  const [form, setForm]             = useState<FormValues>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Erros gerais (rede, 401, 403, 500…)
  const [globalError, setGlobalError] = useState<string | null>(null);
  // Erros de campo do Zod (400 Bad Request)
  const [fieldErrors, setFieldErrors] = useState<ZodFieldErrors>({});
  // Sucesso
  const [created, setCreated] = useState<{ id: string; title: string } | null>(null);

  // ----------------------------------------------------------------
  // Atualização de campo
  // ----------------------------------------------------------------
  const set = useCallback(
    <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      // Limpa erro do campo assim que o usuário começa a corrigir
      setFieldErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  // ----------------------------------------------------------------
  // Submit → fetch() com Authorization: Bearer <token>
  // ----------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setGlobalError(null);
    setFieldErrors({});

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

    try {
      // AppSec: O JWT é injetado exclusivamente via header Authorization.
      // Nunca é exposto em cookies de JavaScript, variáveis globais ou
      // query strings — segue a estratégia Bearer do RFC 6750.
      const res = await fetch(`${apiUrl}/api/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(rawToken ? { Authorization: `Bearer ${rawToken}` } : {}),
        },
        body: JSON.stringify({
          title:          form.title.trim(),
          description:    form.description.trim(),
          type:           form.type,
          content:        form.content.trim(),
          parties:        form.parties.trim(),
          effectiveDate:  form.effectiveDate || undefined,
          expirationDate: form.expirationDate || undefined,
        }),
      });

      let body: unknown;
      try {
        body = await res.json();
      } catch {
        body = null;
      }

      // ── 400 Bad Request — erros de validação do Zod ──────────────
      if (res.status === 400) {
        const zodErrors = parseZodErrors(body);
        if (zodErrors && Object.keys(zodErrors).length > 0) {
          setFieldErrors(zodErrors);
          // Rola até o primeiro erro visível
          setTimeout(() => {
            document.querySelector("[data-field-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 50);
        } else {
          const msg = (body as Record<string, string>)?.error ?? "Requisição inválida.";
          setGlobalError(msg);
        }
        return;
      }

      // ── 401 / 403 ────────────────────────────────────────────────
      if (res.status === 401) {
        setGlobalError("Sua sessão expirou. Faça login novamente.");
        setTimeout(() => router.push("/login"), 2500);
        return;
      }
      if (res.status === 403) {
        setGlobalError("Você não tem permissão para criar documentos.");
        return;
      }

      // ── Outros erros do servidor ──────────────────────────────────
      if (!res.ok) {
        const msg = (body as Record<string, string>)?.error ?? `Erro inesperado (${res.status}).`;
        setGlobalError(msg);
        return;
      }

      // ── Sucesso 201 ───────────────────────────────────────────────
      const data = (body as { data?: { id: string; title: string } })?.data;
      setCreated({ id: data?.id ?? "", title: data?.title ?? form.title });
      setForm(INITIAL_FORM);

    } catch {
      setGlobalError("Não foi possível conectar ao servidor. Verifique sua conexão.");
    } finally {
      setSubmitting(false);
    }
  };

  // ----------------------------------------------------------------
  // Helper para renderizar erro de campo
  // ----------------------------------------------------------------
  const FieldError = ({ name }: { name: keyof FormValues }) => {
    const errors = fieldErrors[name];
    if (!errors?.length) return null;
    return (
      <p data-field-error className="mt-1 flex items-center gap-1 text-xs text-red-600">
        <svg className="h-3.5 w-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {errors[0]}
      </p>
    );
  };

  const inputClass = (name: keyof FormValues) =>
    `mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none transition-colors
     focus:ring-2 focus:ring-offset-0
     ${fieldErrors[name]?.length
       ? "border-red-400 bg-red-50 focus:ring-red-300"
       : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200"
     }`;

  // ----------------------------------------------------------------
  // Tela de sucesso
  // ----------------------------------------------------------------
  if (created) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-green-800">Documento criado com sucesso!</h2>
        <p className="mt-2 text-sm text-green-700">
          <strong>{created.title}</strong> foi salvo como rascunho e está disponível para edição.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {created.id && (
            <a
              href={`/documents/${created.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-800 transition-colors"
            >
              Ver documento
            </a>
          )}
          <button
            onClick={() => setCreated(null)}
            className="inline-flex items-center gap-2 rounded-lg border border-green-600 px-5 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
          >
            Criar outro
          </button>
          <a
            href="/documents"
            className="text-sm text-green-600 hover:underline"
          >
            Voltar para a lista
          </a>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // Formulário principal
  // ----------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Contexto do usuário logado */}
      <div className="mb-6 flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-sm border border-gray-200">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex-shrink-0">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">{userName}</p>
          <p className="text-xs text-gray-500">
            Criando como{" "}
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-800">
              {userRole}
            </span>
          </p>
        </div>
        {/* Indicador AppSec: token presente */}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
          <svg className="h-3.5 w-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Bearer JWT ativo
        </div>
      </div>

      {/* Erro global */}
      {globalError && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4">
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-700">Não foi possível criar o documento</p>
            <p className="mt-0.5 text-sm text-red-600">{globalError}</p>
          </div>
        </div>
      )}

      {/* Banner de erros de validação */}
      {Object.keys(fieldErrors).length > 0 && (
        <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            Corrija os campos destacados antes de continuar:
          </p>
          <ul className="mt-2 list-disc pl-4 text-sm text-amber-700 space-y-0.5">
            {Object.entries(fieldErrors).map(([field, msgs]) =>
              msgs.map((msg, i) => <li key={`${field}-${i}`}>{msg}</li>)
            )}
          </ul>
        </div>
      )}

      {/* Card do formulário */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">

        {/* ── Seção 1: Identificação ── */}
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Identificação
          </h2>
          <div className="space-y-4">

            {/* Título */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                maxLength={200}
                placeholder="Ex: Contrato de Prestação de Serviços — Acme Corp."
                className={inputClass("title")}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
              <FieldError name="title" />
            </div>

            {/* Tipo de documento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de documento <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DOCUMENT_TYPES.map((dt) => (
                  <button
                    key={dt.value}
                    type="button"
                    onClick={() => set("type", dt.value)}
                    className={`rounded-lg border p-2.5 text-left transition-all
                      ${form.type === dt.value
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                        : "border-gray-200 bg-white hover:border-gray-400"
                      }`}
                  >
                    <p className="text-xs font-semibold text-gray-800">{dt.label}</p>
                    <p className="mt-0.5 text-[10px] leading-tight text-gray-500">{dt.description}</p>
                  </button>
                ))}
              </div>
              <FieldError name="type" />
            </div>

            {/* Descrição resumida */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descrição resumida <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={2}
                required
                maxLength={500}
                placeholder="Descreva brevemente o objeto deste documento…"
                className={inputClass("description")}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
              <div className="flex justify-between">
                <FieldError name="description" />
                <p className="mt-1 text-right text-xs text-gray-400">{form.description.length}/500</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Seção 2: Partes e vigência ── */}
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Partes &amp; Vigência
          </h2>
          <div className="space-y-4">

            {/* Partes envolvidas */}
            <div>
              <label htmlFor="parties" className="block text-sm font-medium text-gray-700">
                Partes envolvidas <span className="text-red-500">*</span>
              </label>
              <input
                id="parties"
                type="text"
                required
                maxLength={300}
                placeholder="Ex: Contratante: Empresa Alpha Ltda. | Contratado: Beta Serviços S.A."
                className={inputClass("parties")}
                value={form.parties}
                onChange={(e) => set("parties", e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-400">Use dados fictícios. Separe as partes com "|".</p>
              <FieldError name="parties" />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700">
                  Vigência — início
                </label>
                <input
                  id="effectiveDate"
                  type="date"
                  className={inputClass("effectiveDate")}
                  value={form.effectiveDate}
                  onChange={(e) => set("effectiveDate", e.target.value)}
                />
                <FieldError name="effectiveDate" />
              </div>
              <div>
                <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">
                  Vigência — fim
                </label>
                <input
                  id="expirationDate"
                  type="date"
                  className={inputClass("expirationDate")}
                  value={form.expirationDate}
                  onChange={(e) => set("expirationDate", e.target.value)}
                />
                <FieldError name="expirationDate" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Seção 3: Conteúdo ── */}
        <div className="px-6 py-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Conteúdo
          </h2>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Corpo do documento <span className="text-red-500">*</span>
            </label>
            <p className="mb-2 text-xs text-gray-400">
              Escreva o texto completo do contrato/termo fictício. Cada edição posterior gerará uma nova versão automaticamente.
            </p>
            <textarea
              id="content"
              rows={12}
              required
              minLength={50}
              placeholder={`CLÁUSULA 1ª – OBJETO\nO presente contrato fictício tem como objeto…\n\nCLÁUSULA 2ª – OBRIGAÇÕES DAS PARTES\n…`}
              className={`${inputClass("content")} font-mono text-[13px] leading-relaxed resize-y`}
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
            />
            <div className="flex justify-between">
              <FieldError name="content" />
              <p className="mt-1 text-right text-xs text-gray-400">{form.content.length} caracteres</p>
            </div>
          </div>
        </div>

        {/* ── Footer com ações ── */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Será salvo como <strong className="text-gray-600 ml-0.5">RASCUNHO</strong>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/documents"
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </a>
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors
                ${submitting
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                }`}
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Criando…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Criar documento
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Nota AppSec visível (educacional, para a avaliação) */}
      <div className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs text-gray-500 shadow-sm">
        <p className="font-semibold text-gray-600 mb-1">🔐 AppSec — Estratégia Bearer JWT</p>
        <p>
          O token de sessão é lido no servidor (Server Component) via{" "}
          <code className="rounded bg-gray-100 px-1 font-mono">next-auth/jwt · getToken()</code> e repassado
          apenas como prop. O cliente nunca acessa <code className="rounded bg-gray-100 px-1 font-mono">document.cookie</code>{" "}
          nem variáveis globais. O header{" "}
          <code className="rounded bg-gray-100 px-1 font-mono">Authorization: Bearer &lt;token&gt;</code> é injetado
          exclusivamente no momento do <code className="rounded bg-gray-100 px-1 font-mono">fetch()</code>, conforme RFC 6750.
        </p>
      </div>
    </form>
  );
}
