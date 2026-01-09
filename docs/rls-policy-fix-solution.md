# Solução: Política RLS para Criação de Usuários

## Problema Identificado

A política existente `usuarios_policy` está bloqueando a operação INSERT na tabela `public.usuarios`.

### Política Atual (Bloqueando INSERT)

```sql
alter policy "usuarios_policy"
on "public"."usuarios"
to public
using (
  ((deleted_at IS NULL) AND (is_admin() OR (id = auth.uid())))
);
```

**Por que esta política bloqueia INSERT:**
1. A política está aplicando `USING` para INSERT, mas para INSERT o Supabase usa `WITH CHECK` em vez de `USING`
2. A condição `(id = auth.uid())` não permite INSERT porque o novo usuário ainda não tem um ID que corresponda ao `auth.uid()` do usuário atual
3. A função `is_admin()` pode não estar funcionando corretamente ou o usuário atual não é considerado admin

## Solução

Você precisa criar uma política específica para INSERT que permita que usuários autenticados insiram novos usuários.

### Opção 1: Criar Nova Política para INSERT (RECOMENDADO)

Esta é a solução mais segura e específica. Crie uma nova política apenas para INSERT que permite que usuários autenticados insiram novos usuários.

```sql
-- Política: Usuários autenticados podem inserir novos usuários
CREATE POLICY "Authenticated users can insert usuarios"
ON usuarios
FOR INSERT
TO authenticated
WITH CHECK (true);
```

**Explicação:**
- `FOR INSERT`: Aplica apenas a operações INSERT
- `TO authenticated`: Usuário deve estar logado
- `WITH CHECK (true)`: Bypass todas as verificações RLS para inserts

### Opção 2: Modificar Política Existente (ALTERNATIVA)

Se você preferir modificar a política existente, pode atualizá-la para usar `WITH CHECK` para INSERT:

```sql
-- Modificar política existente para usar WITH CHECK para INSERT
ALTER POLICY "usuarios_policy"
ON "public"."usuarios"
TO public
USING (
  ((deleted_at IS NULL) AND (is_admin() OR (id = auth.uid())))
)
WITH CHECK (
  ((deleted_at IS NULL) AND (is_admin() OR (id = auth.uid())))
);
```

**Explicação:**
- Adiciona `WITH CHECK` para INSERT
- Mantém a mesma condição para todas as operações

### Opção 3: Criar Política Específica para Administradores (MAIS SEGURO)

Se você quiser restringir a criação de usuários apenas para administradores, crie uma política específica:

```sql
-- Política: Apenas administradores podem inserir novos usuários
CREATE POLICY "Admins can insert usuarios"
ON usuarios
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin()
);
```

**Explicação:**
- `FOR INSERT`: Aplica apenas a operações INSERT
- `TO authenticated`: Usuário deve estar logado
- `WITH CHECK (is_admin())`: Apenas usuários com função de administrador podem inserir

## Como Aplicar a Solução

### Passo 1: Acessar o Supabase Dashboard

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá para: **SQL Editor**

### Passo 2: Executar o SQL

Escolha uma das opções acima e cole o SQL no editor:

**Opção 1 (RECOMENDADA):**
```sql
-- Política: Usuários autenticados podem inserir novos usuários
CREATE POLICY "Authenticated users can insert usuarios"
ON usuarios
FOR INSERT
TO authenticated
WITH CHECK (true);
```

**Opção 2 (ALTERNATIVA):**
```sql
-- Modificar política existente para usar WITH CHECK para INSERT
ALTER POLICY "usuarios_policy"
ON "public"."usuarios"
TO public
USING (
  ((deleted_at IS NULL) AND (is_admin() OR (id = auth.uid())))
)
WITH CHECK (
  ((deleted_at IS NULL) AND (is_admin() OR (id = auth.uid())))
);
```

**Opção 3 (MAIS SEGURO):**
```sql
-- Política: Apenas administradores podem inserir novos usuários
CREATE POLICY "Admins can insert usuarios"
ON usuarios
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin()
);
```

### Passo 3: Clicar em "Run"

Clique no botão **"Run"** para executar o SQL.

### Passo 4: Verificar se a Política Foi Criada

1. Vá para: **Authentication** → **Policies**
2. Procure a tabela: `usuarios`
3. Verifique se a nova política aparece na lista

## Testar a Criação de Usuário

1. Crie um novo usuário na aplicação
2. Verifique os logs do console (F12) procurando por:
   - `🔍 [USUARIOS DEBUG] Starting user creation:`
   - `🔍 [USUARIOS DEBUG] Calling signUp for user:`
   - `🔍 [USUARIOS DEBUG] User created in auth.users with ID:`
   - `🔍 [USUARIOS DEBUG] Attempting to insert into public.usuarios:`
   - `✅ [USUARIOS DEBUG] User successfully created in both tables:`

3. Verifique no Supabase Dashboard se o usuário aparece em ambas as tabelas:
   - `auth.users`
   - `public.usuarios`

4. Confirme que o administrador continua logado após criar um novo usuário

## Troubleshooting

### Problema: A política não foi criada

**Solução:**
- Verifique se você tem permissões para criar políticas
- Verifique se o SQL está correto
- Verifique se o nome da política não conflita com políticas existentes

### Problema: A política foi criada mas ainda não funciona

**Solução:**
- Verifique se a política está ativa
- Verifique se o usuário está autenticado
- Verifique se a tabela `usuarios` tem RLS habilitado
- Verifique se há outras políticas que estão bloqueando a operação

### Problema: Erro 401 ainda aparece

**Solução:**
- Verifique se o usuário está autenticado
- Verifique se o token de autenticação é válido
- Verifique se há outras políticas que estão bloqueando a operação
- Verifique se a política está ativa
- Verifique se você está usando a opção correta (WITH CHECK para INSERT)

## Recomendação

**Recomendo usar a Opção 1** porque:
- É a solução mais simples e direta
- Permite que qualquer usuário autenticado crie novos usuários
- Não depende da função `is_admin()` que pode não estar funcionando corretamente
- Usa `WITH CHECK (true)` que bypass todas as verificações RLS para inserts

Se você quiser restringir a criação de usuários apenas para administradores, use a **Opção 3**.
