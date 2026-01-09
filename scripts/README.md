# Scripts do VisuLab

Este diretório contém scripts utilitários para gerenciar dados do banco de dados Supabase.

## Scripts Disponíveis

### 1. validate-scheema.ts
**Valida a consistência entre o arquivo `scheema-sql.json` e o banco de dados Supabase.**

#### Uso
```bash
npm run validate:scheema
```

#### O que faz
- Lê o arquivo `scheema-sql.json` na raiz do projeto
- Conecta ao Supabase usando as credenciais do `.env.local`
- Compara os registros do JSON com os do banco de dados
- Gera um relatório detalhado de discrepâncias

#### Saída
O script gera um relatório mostrando:
- Quantidade de registros por tabela (JSON vs Banco)
- Registros faltando no banco
- Registros extras no banco
- Diferenças em valores de campos
- Status geral de validação

#### Quando usar
- Para verificar se o banco está sincronizado com o JSON
- Para identificar dados faltando ou divergentes
- Antes de importar dados do JSON

---

### 2. import-scheema-json.ts
**Importa dados do arquivo `scheema-sql.json` para o banco de dados Supabase.**

#### Uso
```bash
npm run import:scheema
```

#### Requisitos
Para importar dados com sucesso, você precisa ter a **SERVICE_ROLE KEY** configurada:

1. Obtenha a service_role key no painel do Supabase:
   - Vá em: Project Settings → API
   - Copie a chave **service_role** (secret)

2. Adicione ao arquivo `.env.local`:
   ```env
   VITE_SUPABASE_SERVICE_KEY=sua-service-role-key-aqui
   ```

3. Execute o script de importação

#### O que faz
- Lê e valida a estrutura do `scheema-sql.json`
- Normaliza dados (roles, status, etc.)
- Importa registros na ordem correta (respeitando FKs)
- Usa upsert (insert ou update se já existe)
- Gera relatório de sucesso/falha

#### Ordem de Importação
1. `tipos` (sem dependências)
2. `indices` (sem dependências)
3. `tratamentos` (sem dependências)
4. `empresas` (sem dependências)
5. `usuarios` (depende de empresas)
6. `compras` (sem dependências)
7. `faltas` (depende de todos acima)

#### Quando usar
- Para popular o banco com dados do `scheema-sql.json`
- Para restaurar dados de backup
- Para sincronizar dados entre ambientes

#### Notas Importantes
- Se usar apenas `VITE_SUPABASE_ANON_KEY`, as políticas RLS bloquearão a importação
- A `VITE_SUPABASE_SERVICE_KEY` ignora as RLS policies e permite escrita total
- O arquivo `.env.local` já está protegido no `.gitignore` (linha 13: `*.local`)

---

### 3. seed-database.ts
**Popula o banco de dados com dados de teste iniciais.**

#### Uso
```bash
npm run seed:db
```

#### O que faz
- Cria dados de teste para desenvolvimento
- Popula todas as tabelas principais
- Cria usuários de teste (admin, usuários)

#### Quando usar
- Para inicializar um banco de dados vazio
- Para criar dados de teste para desenvolvimento

---

### 4. seed-database.sql
**Script SQL para popular o banco de dados diretamente via psql.**

#### Uso
```bash
npm run seed:db:sql
```

#### Requisitos
- Ter o `psql` instalado
- Ter a variável de ambiente `DATABASE_URL` configurada

#### Quando usar
- Para executar SQL diretamente no banco
- Para testes de integração com banco real

---

## Arquivo scheema-sql.json

### Propósito
O arquivo [`scheema-sql.json`](../scheema-sql.json) é uma **referência** dos dados existentes no banco de dados Supabase. Ele contém:

- **Tabelas de referência**: `tipos`, `indices`, `tratamentos`
- **Tabelas principais**: `empresas`, `usuarios`, `compras`, `faltas`
- **Dados reais**: Registros exportados do banco de produção ou desenvolvimento

### Estrutura
```json
[
  {
    "export_all_public_tables": {
      "tipos": [...],
      "indices": [...],
      "tratamentos": [...],
      "empresas": [...],
      "usuarios": [...],
      "compras": [...],
      "faltas": [...]
    }
  }
]
```

### Quando Atualizar
- Quando você adiciona novos dados ao banco que deseja documentar
- Quando faz alterações estruturais nos dados
- Quando cria um backup dos dados atuais

### Como Atualizar
1. Exporte os dados do Supabase (via painel ou script)
2. Atualize o arquivo `scheema-sql.json`
3. Execute `npm run validate:scheema` para verificar consistência

---

## Configuração do Supabase

### Variáveis de Ambiente Necessárias

As seguintes variáveis devem estar configuradas no arquivo `.env.local`:

```env
# URL do projeto Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co

# Chave anônima (leitura pública)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Chave de serviço (escrita total, opcional)
VITE_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Onde Obter as Chaves

1. **VITE_SUPABASE_URL** e **VITE_SUPABASE_ANON_KEY**:
   - Vá em: Project Settings → API
   - Copie Project URL e anon public key

2. **VITE_SUPABASE_SERVICE_KEY**:
   - Vá em: Project Settings → API
   - Copie a chave **service_role** (secret)
   - ⚠️ NUNCA compartilhe esta chave publicamente

### Diferença Entre Chaves

| Chave | Permissões | Uso | RLS |
|--------|-------------|-------|------|
| `anon` | Leitura pública | Aplicativo frontend | ✅ Respeita |
| `service_role` | Escrita total | Scripts de importação/seed | ❌ Ignora |

---

## Troubleshooting

### Erro: "Missing Supabase credentials"
**Causa**: Variáveis de ambiente não configuradas

**Solução**:
1. Verifique se o arquivo `.env.local` existe
2. Confirme que `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão definidas
3. Reinicie o servidor de desenvolvimento

### Erro: "new row violates row-level security policy"
**Causa**: Tentando importar dados usando `anon` key

**Solução**:
1. Adicione `VITE_SUPABASE_SERVICE_KEY` ao `.env.local`
2. Execute o script novamente

### Erro: "Invalid JSON structure"
**Causa**: Arquivo `scheema-sql.json` está corrompido ou mal formatado

**Solução**:
1. Verifique a sintaxe JSON do arquivo
2. Confirme que tem a estrutura esperada (`export_all_public_tables`)
3. Reexporte os dados do Supabase se necessário

### Validação mostra discrepâncias
**Causa**: O banco foi modificado desde a última exportação do JSON

**Solução**:
1. Revise as discrepâncias no relatório
2. Atualize o `scheema-sql.json` com os dados atuais do banco
3. OU importe os dados do JSON para sincronizar o banco

---

## Boas Práticas

### 1. Versionamento
- Mantenha o `scheema-sql.json` no controle de versão
- Commit mudanças importantes nos dados
- Use branches para experimentos

### 2. Backup
- Sempre faça backup antes de importar dados
- Use o script de validação antes de importações
- Mantenha cópias do `.env.local` seguro

### 3. Segurança
- NUNCA commit chaves privadas (service_role)
- O `.gitignore` já protege `.env.local`
- Use variáveis de ambiente para credenciais

### 4. Testes
- Valide dados antes de importar
- Teste o aplicativo após importações
- Verifique se todos os serviços funcionam corretamente

---

## Fluxo de Trabalho Típico

### Desenvolvimento com Dados Reais

1. **Validar dados atuais**:
   ```bash
   npm run validate:scheema
   ```

2. **Iniciar aplicativo**:
   ```bash
   npm run dev
   ```

3. **Testar funcionalidades** com dados do banco Supabase

### Sincronizar Dados do JSON

1. **Obter service_role key** do painel Supabase
2. **Adicionar ao `.env.local****:
   ```env
   VITE_SUPABASE_SERVICE_KEY=...
   ```

3. **Importar dados**:
   ```bash
   npm run import:scheema
   ```

4. **Validar importação**:
   ```bash
   npm run validate:scheema
   ```

5. **Testar aplicativo** com os novos dados

---

## Suporte

Para mais informações:
- Documentação do Supabase: https://supabase.com/docs
- Schema do banco: [`specs/database_scheema.yaml`](../specs/database_scheema.yaml)
- Resumo do schema: [`database-schema-summary.md`](../database-schema-summary.md)
