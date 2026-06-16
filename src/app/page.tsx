// src/app/page.tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  // Redireciona automaticamente qualquer acesso na raiz para a tela de login
  redirect("/login");
}