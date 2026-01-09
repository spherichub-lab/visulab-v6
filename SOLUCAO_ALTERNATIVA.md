# 🔧 SOLUÇÃO ALTERNATIVA - Sem Edge Functions

Como seu plano do Supabase não suporta Edge Functions, usaremos uma solução alternativa que acessa a API Management diretamente.

## ⚠️ AVISO DE SEGURANÇA

Esta solução expõe a **service role key** no lado do cliente, o que **NÃO é recomendado para produção**. Use apenas:
- Em ambiente de desenvolvimento
- Para testes
- Se você não tem outras opções (Edge Functions, servidor backend, etc.)

## 📋 PASSO A PASSO (3 minutos)

### 1️⃣ Obtenha sua Service Role Key

1. Vá para o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **Settings** (⚙️)
4. Clique em **API**
5. Role para baixo até **Project API keys**
6. Encontre a chave chamada **service_role**
7. Clique no botão de copiar 📋 ao lado dela

### 2️⃣ Abra o arquivo .env.local

1. No seu projeto, abra o arquivo `.env.local`
2. Se o arquivo não existir, crie um novo arquivo chamado `.env.local` na raiz do projeto

### 3️⃣ Adicione a Service Role Key

Adicione esta linha ao arquivo `.env.local`:

```env
VITE_SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

**Importante:** Substitua `sua-service-role-key-aqui` pela chave que você copiou no passo 1.

### 4️⃣ Salve o arquivo

Salve o arquivo `.env.local`

### 5️⃣ Reinicie o servidor de desenvolvimento

1. Pare o servidor (Ctrl+C no terminal)
2. Inicie novamente: `npm run dev`

### 6️⃣ Teste a solução

1. Atualize sua aplicação (F5)
2. Faça login como administrador
3. Vá para a página de Usuários
4. Edite um usuário existente
5. Digite uma nova senha no campo de senha
6. Clique em **Salvar Alterações**
7. Faça logout
8. Tente fazer login como esse usuário com a nova senha

## ✅ Como saber que funcionou

Se tudo estiver correto:
- Você verá a mensagem "Usuário atualizado." (sem erro)
- O usuário conseguirá fazer login com a nova senha
- Nenhuma mensagem de erro aparecerá

## ❌ Se ainda der erro

### Erro: "Service role key not configured"
**Solução:** Você não adicionou a linha no arquivo `.env.local` ou não reiniciou o servidor

### Erro: "Only administrators can update other users' passwords"
**Solução:** Certifique-se de que está logado como um usuário administrador

### Erro: "Failed to update password (HTTP 401)"
**Solução:** A service role key está incorreta. Verifique se você copiou a chave correta (service_role, não anon key)

## 📝 Exemplo do arquivo .env.local

Seu arquivo `.env.local` deve ficar parecido com isto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔒 Considerações de Segurança

**Para desenvolvimento:** Esta solução é aceitável.

**Para produção:** Você DEVE usar uma das seguintes alternativas:
1. Edge Functions do Supabase (plano Pro)
2. Servidor backend próprio
3. PostgreSQL RPC function (com permissões adequadas)

## 📝 Resumo

✅ Código atualizado em `services/usuariosService.ts` para usar API Management
✅ `pages/Users.tsx` atualizado para passar a senha ao editar
⏳ **Você precisa adicionar a service role key no .env.local (passos 1-5 acima)**

**Depois de adicionar a service role key e reiniciar o servidor, a atualização de senha funcionará!** 🎉
