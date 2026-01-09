# Guia: Ajustar Políticas RLS para Criação de Usuários

## Problema Identificado

Ao tentar criar um novo usuário, o sistema está retornando um erro **401 (Unauthorized)** ao tentar inserir na tabela `public.usuarios`. Isso indica que as **políticas RLS (Row Level Security)** estão bloqueando a operação.

### Sintomas

- Usuário é criado com sucesso em `auth.users` (você confirmou isso)
- Erro 401 ao tentar inserir em `public.usuarios`
- Console mostra: `Failed to create user in public.usuarios: Object`
- O objeto de erro está vazio (sem message, code, details, hint)

## Causa Raiz

As políticas RLS da tabela `usuarios` estão configuradas para permitir apenas que usuários insiram seus próprios registros, mas NÃO permitem que administradores insiram novos usuários.

## Solução: Ajustar Políticas RLS no Supabase

Você precisa criar uma política que permite que usuários autenticados possam inserir novos usuários.

### Passo 1: Acessar o Supabase Dashboard

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá para: **Authentication** → **Policies**
4. Procure a tabela: `usuarios`
5. Clique para ver as políticas existentes
6. Identifique políticas que bloqueiam operações `INSERT`

### Passo 2: Criar Política para Permitir Inserts

Você precisa criar uma política que permite que usuários autenticados possam inserir novos usuários.

### SQL da Política

```sql
-- Política: Usuários autenticados podem inserir novos usuários
CREATE POLICY "Admins can insert any user"
ON usuarios
FOR INSERT
TO authenticated
USING (true);
```

**Explicação**:
- `authenticated`: Usuário deve estar logado
- `USING (true)`: Bypass todas as verificações RLS para inserts
- Isso permite que administradores insiram novos usuários

### Passo 3: Salvar a Política

1. Após criar a política, clique em **"Save"**
2. Verifique se o nome da política está correto

### Passo 4: Testar a Criação

1. Crie um novo usuário na aplicação
2. Verifique se funciona
3. Verifique os logs do console (F12) procurando por:
   - `🔍 [USUARIOS DEBUG] Starting user creation:`
   - `🔍 [USUARIOS DEBUG] Calling signUp for user:`
   - `🔍 [USUARIOS DEBUG] User created in auth.users with ID:`
   - `🔍 [USUARIOS DEBUG] Attempting to insert into public.usuarios:`
   - `✅ [USUARIOS DEBUG] User successfully created in both tables:`

Se você ver `❌ [USUARIOS DEBUG] Failed to create user in public.usuarios`, a política ainda está bloqueando.

4. Verifique no Supabase Dashboard se o usuário aparece em ambas as tabelas (auth.users e public.usuarios)
5. Confirmar que o administrador continua logado após criar um novo usuário

## Solução Alternativa: Desabilitar Políticas RLS Temporariamente

Se você quiser testar rapidamente, pode desabilitar as políticas RLS:

1. Vá para: **Authentication** → **Policies**
2. Procure a tabela: `usuarios`
3. Clique no botão **"Disable RLS"** ou **"Enable RLS"**
4. Desabilite temporariamente para testar

⚠️ **Atenção**: Isso é apenas para teste. Em produção, você deve usar políticas RLS apropriadas.

## Como Criar a Política no Supabase Dashboard

### Opção 1: Usando o Editor SQL

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá para: **SQL Editor**
4. Cole o SQL da política:
   ```sql
   CREATE POLICY "Admins can insert any user"
   ON usuarios
   FOR INSERT
   TO authenticated
   USING (true);
   ```
5. Clique em **"Run"**
6. Verifique se a política foi criada com sucesso

### Opção 2: Usando o Editor de Políticas

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá para: **Authentication** → **Policies**
4. Procure a tabela: `usuarios`
5. Clique em **"New Policy"**
6. Escolha **"Custom"** ou **"For full customization"**
7. Cole o SQL da política:
   ```sql
   CREATE POLICY "Admins can insert any user"
   ON usuarios
   FOR INSERT
   TO authenticated
   USING (true);
   ```
8. Clique em **"Save"**
9. Verifique se a política foi criada com sucesso

## Verificar se a Política Está Funcionando

### Método 1: Verificar no Supabase Dashboard

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá para: **Authentication** → **Policies**
4. Procure a tabela: `usuarios`
5. Verifique se a política "Admins can insert any user" está ativa

### Método 2: Verificar os Logs do Console

1. Abra o console do navegador (F12)
2. Tente criar um novo usuário
3. Verifique os logs:
   - Se você ver `✅ [USUARIOS DEBUG] User successfully created in both tables:`, a política está funcionando
   - Se você ver `❌ [USUARIOS DEBUG] Failed to create user in public.usuarios`, a política ainda está bloqueando

### Método 3: Verificar as Tabelas no Supabase Dashboard

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá para: **Database** → **Tables**
4. Verifique a tabela `auth.users` para confirmar que o usuário foi criado
5. Verifique a tabela `public.usuarios` para confirmar que o usuário foi criado

## Checklist de Solução

- [ ] Acessar Supabase Dashboard
- [ ] Ir para Authentication → Policies
- [ ] Verificar políticas da tabela `usuarios`
- [ ] Criar política para permitir inserts
- [ ] Salvar a política
- [ ] Testar criação de usuário
- [ ] Verificar logs do console
- [ ] Confirmar que usuário aparece em `public.usuarios`
- [ ] Confirmar que o administrador continua logado

## Troubleshooting

### Problema: A política não foi criada

**Solução**:
- Verifique se você tem permissões para criar políticas
- Verifique se o SQL está correto
- Verifique se o nome da política não conflita com políticas existentes

### Problema: A política foi criada mas ainda não funciona

**Solução**:
- Verifique se a política está ativa
- Verifique se o usuário está autenticado
- Verifique se a tabela `usuarios` tem RLS habilitado
- Verifique se há outras políticas que estão bloqueando a operação

### Problema: Erro 401 ainda aparece

**Solução**:
- Verifique se o usuário está autenticado
- Verifique se o token de autenticação é válido
- Verifique se há outras políticas que estão bloqueando a operação
- Verifique se a política está ativa

## Suporte

Se após ajustar as políticas RLS você ainda tiver problemas:

1. **Verifique o console** para mensagens de erro específicas
2. **Verifique o Supabase Dashboard** para ver se as políticas estão ativas
3. **Verifique os logs do Supabase** no Dashboard
4. **Contate o suporte do Supabase** se necessário

## Recursos Adicionais

- [Documentação do Supabase sobre RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Editor de Políticas do Supabase](https://app.supabase.com/project/_/auth/policies)
- [Guia de Troubleshooting de RLS](https://supabase.com/docs/guides/auth/row-level-security#troubleshooting)
