// src/middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// AppSec: Defesa de rotas. Barreira ativa de escalonamento de privilégios.
export default auth((req) => {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    // Não autenticado: chuta para o login
    if (!req.auth) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    // Autenticado, mas sem privilégio: 403 Forbidden demonstrável
    if (req.auth.user?.role !== "ADMINISTRADOR") {
      return new NextResponse("403 Forbidden — privilégios insuficientes", {
        status: 403,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
