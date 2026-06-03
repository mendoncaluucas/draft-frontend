# 🗄️ Draft — Front-end (P06-B)

Este repositório contém a interface de usuário (Front-end) do **Draft**, um sistema de gestão de contratos e termos fictícios. 

O projeto é parte da Avaliação N3 da disciplina de **Segurança da Informação** do Centro Universitário Católica SC, ministrada pelo Prof. Edson Vaz Lopes.

> **⚠️ Arquitetura Dividida:** Este projeto segue uma arquitetura separada. O repositório atual concentra apenas o front-end. O back-end (API, regras de negócio e acesso ao banco de dados) está hospedado no repositório [Draft-backend](https://github.com/mendoncaluucas/Draft-backend).

## 🛠️ Stack Tecnológica

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Requisições API:** Fetch API / Axios (consumindo o Draft-backend)
- **Gestão de Sessão (Prevista):** NextAuth.js

## 🔒 Práticas de Segurança Implementadas (Front-end)

- **Gestão de Segredos:** O arquivo `.env` com configurações locais é ignorado pelo `.gitignore`. Apenas o arquivo de referência `.env.example` é versionado.
- **Autorização no Client-side:** Bloqueio e redirecionamento de rotas protegidas dependendo do perfil do usuário autenticado (em integração com a API).


