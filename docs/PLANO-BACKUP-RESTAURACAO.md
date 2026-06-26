# 💾 Plano de Backup e Restauração — Banco de Dados (Prisma / PostgreSQL)

| Campo | Valor |
|---|---|
| **Projeto** | Draft — Gestão de Documentos (P06-B) |
| **Disciplina** | Segurança da Informação (N3) |
| **Frente** | SecOps e Documentação — Planos de Continuidade |
| **Responsável** | Vinícius Steuernagel |
| **Banco** | PostgreSQL (SQLite em ambiente local), acessado via Prisma ORM |

> **Por que isso existe:** o banco concentra os ativos mais valiosos do sistema (usuários, conteúdo dos contratos e a trilha de auditoria). Um plano de backup **testado** é o que diferencia um susto recuperável de uma perda definitiva após falha de hardware, erro humano ou incidente de segurança.

---

## 1. Objetivo

Garantir que os dados e a estrutura do banco do Draft possam ser **restaurados de forma íntegra e rápida** após qualquer evento de perda — corrupção, exclusão acidental, falha de disco ou ataque.

---

## 2. Escopo — O que entra no backup

| Camada | O que é | Onde fica |
|---|---|---|
| **1. Dados** | Conteúdo das tabelas: `User`, `Document`, `DocumentVersion`, **`AuditLog`**, `Comment` | Dump do banco (`.dump`/`.sql`) em local seguro |
| **2. Estrutura** | `schema.prisma` + `prisma/migrations/` | **Versionado no Git** (back-end) |
| **3. Configuração** | `.env` (`DATABASE_URL`, `NEXTAUTH_SECRET`) | Guardado **fora** do Git, em local seguro |

> ⚠️ **O `AuditLog` é evidência forense.** Por sustentar o princípio de Não-Repúdio, ele precisa estar **sempre** incluído no dump — sua perda compromete a rastreabilidade de incidentes.

> A estrutura do banco já é "backupeada" pelo versionamento das **migrations do Prisma**. O dump cuida dos **dados**.

---

## 3. Estratégia (RPO / RTO e Retenção)

| Métrica | Definição | Meta sugerida |
|---|---|---|
| **RPO** | Quanto de dado se aceita perder | Até **24h** (backup diário) |
| **RTO** | Tempo máximo para voltar ao ar | Até **1h** |
| **Frequência** | Periodicidade do dump | Diária (automatizada) |
| **Retenção** | Backups mantidos | Últimos **7 diários** + **4 semanais** |

**Regra 3-2-1:** **3** cópias, em **2** mídias diferentes, com **1** fora da máquina principal.

---

## 4. Procedimento de Backup

### 4.1 Dados (`pg_dump`)

```bash
# Formato custom (.dump) — compacto e flexível para restauração seletiva
pg_dump -U draft_user -h localhost -d draft -F c -f backup_draft_$(date +%Y%m%d).dump
```

Alternativa em SQL legível:

```bash
pg_dump -U draft_user -h localhost -d draft -f backup_draft_$(date +%Y%m%d).sql
```

> **SQLite (ambiente local):** o "backup" é simplesmente copiar o arquivo do banco (ex.: `cp prisma/dev.db backups/dev_$(date +%Y%m%d).db`).

### 4.2 Estrutura (Prisma)

A pasta `prisma/migrations/` e o `schema.prisma` devem estar **sempre commitados** no repositório `draft-backend`. Isso permite recriar toda a estrutura em qualquer máquina com:

```bash
npx prisma migrate deploy
```

### 4.3 Automação (diária)

**Linux/macOS — `cron`** (todo dia às 2h):

```bash
0 2 * * * pg_dump -U draft_user -h localhost -d draft -F c \
  -f /backups/backup_draft_$(date +\%Y\%m\%d).dump
```

**Windows:** use o **Agendador de Tarefas** chamando um `.bat` com o mesmo `pg_dump`.

---

## 5. Procedimento de Restauração (passo a passo)

> Cenário: banco perdido/corrompido. Objetivo: voltar ao último ponto íntegro.

1. **Recrie um banco vazio de destino:**
   ```sql
   DROP DATABASE IF EXISTS draft;
   CREATE DATABASE draft;
   GRANT ALL PRIVILEGES ON DATABASE draft TO draft_user;
   ```

2. **Restaure os dados** a partir do dump mais recente:
   ```bash
   # Arquivo .dump (formato custom)
   pg_restore -U draft_user -h localhost -d draft backup_draft_AAAAMMDD.dump

   # Arquivo .sql
   psql -U draft_user -h localhost -d draft -f backup_draft_AAAAMMDD.sql
   ```

3. **Sincronize as migrations** do Prisma com o banco restaurado:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

4. **(Sem dump de dados — só estrutura)** recrie do zero e repovoe:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

5. **Valide a restauração:**
   - `npx prisma studio` para inspecionar as tabelas (incluindo `AuditLog`).
   - Suba a API e o front e teste login + uma ação que gere log.

---

## 6. Teste de Restauração (obrigatório)

> Backup que nunca foi restaurado **não é** backup — é uma suposição.

- Periodicidade: teste a restauração em ambiente isolado ao menos **uma vez por entrega/sprint**.
- Confirme: a contagem de registros bate (inclusive `AuditLog`) e o login funciona com os dados restaurados.
- Registre data, dump usado e resultado.

---

## 7. Resumo Operacional

| Ação | Comando-chave |
|---|---|
| Backup dos dados | `pg_dump -U draft_user -d draft -F c -f arquivo.dump` |
| Backup da estrutura | `git commit` de `prisma/migrations/` |
| Restaurar dados | `pg_restore -U draft_user -d draft arquivo.dump` |
| Recriar estrutura | `npx prisma migrate deploy` |
| Regenerar client | `npx prisma generate` |
| Validar | `npx prisma studio` + teste de login |

---

> **Boas práticas finais:** nunca guarde o backup no mesmo disco do banco de produção; criptografe dumps que contenham dados de usuários e `AuditLog`; mantenha `DATABASE_URL`/`NEXTAUTH_SECRET` fora do Git; e documente cada restauração como evidência de continuidade (categoria **Recuperar**).
