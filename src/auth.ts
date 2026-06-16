// src/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

        try {
          // Dispara a requisição cross-origin para o nosso back-end
          const res = await fetch(`${apiUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const response = await res.json();

          if (res.ok && response.data) {
            // Retorna o usuário. O NextAuth vai pegar isso e codificar no JWT
            return response.data;
          }
          
          return null;
        } catch (error) {
          console.error("Erro ao validar credenciais:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 dia de validade para a sessão
  },
  pages: {
    signIn: "/login", // Redireciona para nossa tela customizada em caso de erro/acesso negado
  },
  callbacks: {
    // AppSec: Injeta a role do usuário no JWT para uso posterior em autorizações
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role; 
      }
      return token;
    },
    // Disponibiliza as informações do token JWT para o front-end (uso em Server/Client components)
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});