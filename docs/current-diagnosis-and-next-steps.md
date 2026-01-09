# Diagnóstico Atual e Próximos Passos

## Situação Atual

Você relatou que:
1. ✅ Usuário é criado em `auth.users` (confirmado anteriormente)
2. ❌ Usuário NÃO aparece em `public.usuarios`
3. ❌ Administrador é deslogado ao criar novo usuário
4. ❌ Console não mostra logs do `usuariosService.ts`

## Diagnóstico

### Problema 1: Política RLS Bloqueando INSERT

A política existente `usuarios_policy` está bloqueando a operação INSERT na tabela `public.usuarios`:

```sql
-- Política atual (bloqueando INSERT)
alter policy "usuarios_policy"
on "public"."usuarios"
to public
using (
  ((deleted_at IS NULL) AND (is_admin() OR (id = auth.uid())))
);
```

**Por que bloqueia:**
- Usa `USING` para INSERT, mas Supabase usa `WITH CHECK` para INSERT
- A condição `(id = auth.uid())` não permite INSERT porque o novo usuário ainda não tem um ID

### Problema 2: Auto-Login do Novo Usuário

O Supabase automaticamente faz login do novo usuário após `signUp()`, deslogando o administrador.

**Solução implementada:** Adicionei lógica no [`SupabaseAuthService.ts`](src/services/auth/SupabaseAuthService.ts) para detectar e corrigir o auto-login.

### Problema 3: Logs Não Aparecem

O console não está mostrando logs do `usuariosService.ts`, o que indica que o método `create()` pode não estar sendo chamado.

**Solução implementada:** Adicionei logs detalhados no [`Users.tsx`](pages/Users.tsx) para rastrear a execução do `handleSaveUser()`.

## Próximos Passos

### Passo 1: Testar Novamente com Logs Aprimorados

1. **Abra o console do navegador** (F12)
2. **Tente criar um novo usuário**
3. **Verifique os logs** procurando por:
   - `🔍 [USERS DEBUG] handleSaveUser called`
   - `🔍 [USERS DEBUG] Creating new user`
   - `🔍 [USERS DEBUG] Password validated, calling usuariosService.create`
   - `🔍 [USUARIOS DEBUG] Starting user creation:`
   - `🔍 [USUARIOS DEBUG] Calling signUp for user:`
   - `🔍 [USUARIOS DEBUG] User created in auth.users with ID:`
   - `🔍 [USUARIOS DEBUG] Attempting to insert into public.usuarios:`
   - `✅ [USUARIOS DEBUG] User successfully created in both tables:`

4. **Copie e cole os logs aqui** para que eu possa analisar

### Passo 2: Ajustar Políticas RLS no Supabase

Siga o guia em [`docs/rls-policy-fix-solution.md`](docs/rls-policy-fix-solution.md) para criar uma política que permita INSERT:

**Opção 1 (RECOMENDADA):**
```sql
-- Política: Usuários autenticados podem inserir novos usuários
CREATE POLICY "Authenticated users can insert usuarios"
ON usuarios
FOR INSERT
TO authenticated
WITH CHECK (true);
```

**Como aplicar:**
1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá para: **SQL Editor**
4. Cole o SQL acima
5. Clique em **"Run"**

### Passo 3: Verificar se Funcionou

1. **Crie um novo usuário** na aplicação
2. **Verifique os logs do console** (F12)
3. **Verifique no Supabase Dashboard** se o usuário aparece em:
   - `auth.users`
   - `public.usuarios`
4. **Confirme que o administrador continua logado**

## Checklist

- [ ] Testar criação de usuário com logs aprimorados
- [ ] Copiar e colar logs do console
- [ ] Ajustar políticas RLS no Supabase (Opção 1)
- [ ] Testar criação de usuário novamente
- [ ] Verificar se usuário aparece em ambas as tabelas
- [ ] Confirmar que administrador continua logado

## Perguntas para Responder

1. **Os logs aparecem no console agora?** (procure por `[USERS DEBUG]` e `[USUARIOS DEBUG]`)
2. **Qual mensagem de erro aparece?** (se houver)
3. **Você aplicou a política RLS no Supabase?**
4. **O usuário aparece em `auth.users` no Supabase Dashboard?**
5. **O usuário aparece em `public.usuarios` no Supabase Dashboard?**

## Documentos Relevantes

- [`docs/rls-policy-fix-solution.md`](docs/rls-policy-fix-solution.md) - Guia completo para ajustar políticas RLS
- [`services/usuariosService.ts`](services/usuariosService.ts) - Serviço de usuários com logs detalhados
- [`pages/Users.tsx`](pages/Users.tsx) - Componente de usuários com logs detalhados
- [`src/services/auth/SupabaseAuthService.ts`](src/services/auth/SupabaseAuthService.ts) - Serviço de autenticação com correção de auto-login
