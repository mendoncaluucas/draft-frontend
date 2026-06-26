# 🚨 Plano Mínimo de Resposta a Incidente (PMRI)

| Campo | Valor |
|---|---|
| **Projeto** | Draft — Gestão de Documentos (P06-B) |
| **Disciplina** | Segurança da Informação (N3) |
| **Frente** | SecOps e Documentação |
| **Responsável** | Vinícius Steuernagel |
| **Cenários cobertos** | Credencial exposta · Arquivo `.env` vazado · Vazamento do banco de dados |

> **Por que isso existe:** segurança vai muito além do código. Um processo de contingência documentado é o que permite reagir rápido e de forma organizada após um vazamento, reduzindo o dano. Este é um plano **mínimo e operacional**, pensado para execução sob pressão.

---

## 1. Objetivo e Escopo

Definir as ações imediatas para conter, erradicar e se recuperar de incidentes de **exposição de segredos** do Draft (front e back): `NEXTAUTH_SECRET`, `DATABASE_URL`, senha do banco, JWTs de sessão e credenciais de usuários.

---

## 2. Classificação de Severidade

| Nível | Descrição | Exemplo | Resposta-alvo |
|---|---|---|---|
| 🔴 **Crítico** | Segredo que dá acesso a sessões/banco está público | `.env` em repositório público; `NEXTAUTH_SECRET` vazado | Imediata (< 1h) |
| 🟠 **Alto** | Credencial com acesso limitado comprometida | Senha de um usuário | < 4h |
| 🟡 **Médio** | Exposição sem confirmação de uso indevido | Segredo enviado por canal interno errado | < 24h |

> **`NEXTAUTH_SECRET` é sempre Crítico:** com ele, um atacante assina JWTs arbitrários e se passa por **qualquer** usuário (inclusive ADMINISTRADOR), contornando a autenticação.

---

## 3. Papéis e Responsabilidades

| Papel | Responsabilidade |
|---|---|
| **Líder do incidente** (SecOps) | Coordena, decide ações, registra a linha do tempo |
| **Dev Back-end** | Rotaciona segredos do servidor/banco; aplica correções na API |
| **Dev Front-end** | Rotaciona `NEXTAUTH_SECRET` no front; força reautenticação |
| **Comunicação** | Avisa grupo/orientador e, se aplicável, usuários afetados |

> Em equipe pequena, a mesma pessoa pode acumular papéis — o essencial é que **cada ação tenha um dono**.

---

## 4. Ciclo de Resposta (base NIST)

1. **Detecção** — identificar e confirmar o incidente.
2. **Contenção** — estancar a exposição (revogar/invalidar o segredo).
3. **Erradicação** — remover a causa raiz (limpar histórico, corrigir o processo).
4. **Recuperação** — restabelecer operação segura (novos segredos, validação).
5. **Pós-incidente** — registrar lições aprendidas e ajustar a prevenção.

---

## 5. Cenário A — Credencial Exposta

> Ex.: `NEXTAUTH_SECRET`, senha do banco ou senha de um usuário expostos (log, print, mensagem, repositório).

### 🔍 Detecção
- Confirme **qual** credencial vazou, **onde** e **desde quando**.
- Consulte o **`AuditLog`** (`LOGIN`, `ACCESS_DENIED`, ações sensíveis) por `ipAddress`/`userAgent` anômalos.

### 🛑 Contenção (imediata)
- **Se for `NEXTAUTH_SECRET`:** rotacione nos **dois** projetos (front e back).
  ```bash
  openssl rand -base64 32   # gere a nova chave e atualize os dois .env
  ```
  → Invalida **todos os JWTs** existentes, derrubando sessões potencialmente sequestradas.
- **Se for a senha do banco:** altere e atualize a `DATABASE_URL`.
  ```sql
  ALTER USER draft_user WITH ENCRYPTED PASSWORD 'nova_senha_forte';
  ```
- **Se for a senha de um usuário:** force a redefinição e encerre as sessões ativas dele.
  > As senhas ficam com **hash bcrypt** — mesmo num dump, não estão em texto puro; ainda assim, rotacione a comprometida.

### 🧹 Erradicação
- Remova a credencial de qualquer lugar onde apareça (mensagens, prints, logs).
- Identifique **como** vazou e corrija a origem (processo/ferramenta/descuido).

### ♻️ Recuperação
- Reinicie back e front com os novos segredos; valide login e uma chamada autenticada fim-a-fim.
- Monitore o `AuditLog` por 24–48h em busca de uso da credencial antiga.

---

## 6. Cenário B — Arquivo `.env` Vazado

> Ex.: o `.env` (de qualquer um dos repositórios) foi commitado/publicado com `DATABASE_URL`, `NEXTAUTH_SECRET` e/ou `NEXTAUTH_URL`.

### 🔍 Detecção
- Liste **todas** as chaves do arquivo — trate **cada uma** como comprometida.
- Verifique se o repositório era **público** e se houve clones/forks.

### 🛑 Contenção (imediata)
1. **Rotacione TODOS os segredos do arquivo:**
   - Novo `NEXTAUTH_SECRET` nos dois projetos (invalida sessões).
   - Nova senha do banco + nova `DATABASE_URL`.
2. Se o banco estiver acessível pela internet, **restrinja o acesso** (firewall / só `localhost`) até concluir a rotação.

### 🧹 Erradicação — remover o segredo do histórico do Git
> Apagar o arquivo num commit novo **não basta**: ele continua no histórico.

1. Garanta o `.gitignore` (e mantenha o `.env.example` **sem** valores reais):
   ```bash
   echo ".env" >> .gitignore
   echo ".env.local" >> .gitignore
   ```
2. Remova o arquivo do histórico (`git filter-repo` ou BFG) e force o push:
   ```bash
   git rm --cached .env .env.local
   git filter-repo --path .env --path .env.local --invert-paths
   git push origin --force --all
   ```
3. **Considere os segredos antigos permanentemente queimados**, mesmo após a limpeza — por isso a rotação na contenção é obrigatória.

### ♻️ Recuperação
- Suba os projetos com os `.env` novos (locais, fora do versionamento).
- Teste login, criação de documento e acesso à área autenticada.
- Confirme que o banco voltou ao acesso restrito esperado.

---

## 7. Cenário C — Vazamento / Exfiltração do Banco de Dados

> Ex.: cópia indevida do dump, acesso direto ao banco via `DATABASE_URL` comprometida, ou exfiltração das tabelas (`User`, `DocumentVersion`, `AuditLog`, etc.).

### 🔍 Detecção
- Identifique **o que** foi acessado/copiado: contas (`User`), conteúdo de contratos (`DocumentVersion`), dados cadastrais ou a própria trilha (`AuditLog`).
- Procure no `AuditLog` por acessos em massa, horários atípicos e `ipAddress`/`userAgent` desconhecidos.
- Verifique se a `DATABASE_URL` (porta 5432) estava exposta à internet em vez de restrita a `localhost`.

### 🛑 Contenção (imediata)
1. **Corte o acesso ao banco:** restrinja a porta 5432 (firewall / só `localhost`) e encerre conexões suspeitas.
2. **Rotacione a senha do banco** e atualize a `DATABASE_URL`:
   ```sql
   ALTER USER draft_user WITH ENCRYPTED PASSWORD 'nova_senha_forte';
   ```
3. **Rotacione o `NEXTAUTH_SECRET`** nos dois projetos — se o dump incluía sessões/tokens, invalide tudo.
4. Force a **redefinição de senha** dos usuários afetados.

### 🧹 Erradicação
- As senhas estão com **hash bcrypt** (não em texto puro), mas trate-as como expostas a ataque de força bruta offline — por isso a redefinição.
- Avalie a integridade do `AuditLog`: se a trilha pode ter sido adulterada, isso é, por si só, um incidente de **Não-Repúdio** a registrar.
- Corrija a causa raiz (acesso exposto, credencial fraca, dump em local inseguro).

### ♻️ Recuperação
- Restaure os dados a partir de um backup íntegro **anterior** ao comprometimento (ver Plano de Backup e Restauração).
- Suba o sistema com os novos segredos e valide login + uma ação que gere log.
- Monitore o `AuditLog` por 24–48h.

---

## 8. Checklist Rápido de Resposta

- [ ] Incidente confirmado e severidade classificada
- [ ] Segredos afetados identificados (todos)
- [ ] `NEXTAUTH_SECRET` rotacionado nos dois projetos (se aplicável)
- [ ] Senha do banco + `DATABASE_URL` atualizadas (se aplicável)
- [ ] JWTs/sessões antigos invalidados
- [ ] Segredo removido do histórico do Git (se aplicável)
- [ ] `.gitignore` correto e `.env.example` sem valores reais
- [ ] Sistema revalidado (login → recurso protegido)
- [ ] `AuditLog` revisado em busca de uso indevido
- [ ] Acesso ao banco restrito e senha do banco rotacionada (se aplicável)
- [ ] Linha do tempo registrada e lições aprendidas documentadas

---

## 9. Comunicação e Registro

- **Interno:** avise grupo e orientador assim que o incidente for confirmado.
- **Usuários:** se dados puderem ter sido acessados, comunique de forma clara e oriente troca de senha.
- **Registro:** mantenha uma linha do tempo (o quê, quando, quem agiu). O `AuditLog`, com IP e User-Agent, é a principal evidência de **Não-Repúdio** e base para a melhoria do processo.

---

> **Prevenção contínua:** `.env` sempre no `.gitignore`; `.env.example` versionado sem valores; segredos fortes (≥ 32 caracteres) gerados aleatoriamente; nunca compartilhar credenciais por canais inseguros; revisar permissões do banco periodicamente.
