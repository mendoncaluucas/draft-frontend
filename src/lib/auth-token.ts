// src/lib/auth-token.ts
import { cookies } from "next/headers";

// AppSec: O valor do cookie de sessão do NextAuth É o JWT codificado que o
// back-end espera em `decode({ token, secret: AUTH_SECRET })`. Lemos esse cookie
// no servidor (HttpOnly) e o repassamos como Bearer, sem expor o JWT ao JS do cliente.
export function getRawToken(): string | undefined {
  const c = cookies();
  return (
    c.get("authjs.session-token")?.value ??
    c.get("__Secure-authjs.session-token")?.value
  );
}
