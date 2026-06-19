# 🚀 Draft - Interface de Usuário (Front-end)

![Next.js](https://img.shields.io/badge/Next.js_14-App_Router-black?style=for-the-badge&logo=next.js)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-Styling-38B2AC?style=for-the-badge&logo=tailwind-css)
![NextAuth](https://img.shields.io/badge/NextAuth.js_v5-Beta-8A2BE2?style=for-the-badge)

Interface de usuário web para o sistema de gestão de contratos **Draft** (Projeto P06-B) [5]. Totalmente focada na proteção do cliente, a aplicação adota gerenciamento de sessão seguro, trabalhando em uníssono com o back-end, porém em ambiente desacoplado para isolar superfícies de ataque [7].

## 💻 Stack Tecnológica

*   **Framework:** Next.js 14 (App Router) [3].
*   **Estilização:** Tailwind CSS (garantindo consistência e mitigando vetores de injeção inline) [17].
*   **Gestão de Sessões:** NextAuth.js v5 (Beta) [18].

## 🔐 Features de Segurança (AppSec)

*   **Isolamento Cross-Origin:** A aplicação opera em domínio e porta exclusivos, comunicando-se com a API por meio de *Fetch* e injeção dinâmica de *Bearer Tokens* encapsulados no lado do servidor [3, 18].
*   **Sessão Blindada (Cookies):** O NextAuth gerencia as credenciais de acesso emitindo cookies restritos com as *flags* `HttpOnly`, `Secure` e `SameSite=Strict`, oferecendo forte mitigação contra-ataques de XSS e CSRF [18, 19].
*   **Server Components (Proteção na Renderização):** A verificação de sessão e o encapsulamento de *tokens* ocorrem diretamente no ecossistema de servidor do Next.js (Node.js), impedindo que dados sensíveis transitem pelo código JavaScript do navegador [18].

## ⚙️ Variáveis de Ambiente

Para o roteamento e decodificação local funcionarem corretamente, é preciso criar um arquivo `.env.local` na raiz com as seguintes chaves de integração [12]:

```env
# Endereço oficial da API (Back-end) para as requisições cross-origin
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Mesma chave criptográfica utilizada no back-end para gerenciar a sessão
AUTH_SECRET="sua-chave-super-segura-de-no-minimo-32-caracteres"
🚀 Passo a Passo de Execução
Siga o passo a passo para inicializar o sistema de apresentação:
Instalar Dependências:
Iniciar o Servidor de Interface: Inicie a interface de usuário garantindo que ela seja servida obrigatoriamente na porta padrão 3000
:
Acesse o sistema seguro via navegador em http://localhost:3000.
