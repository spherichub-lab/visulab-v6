# 🚨 INSTRUÇÕES PARA CONSERTAR O PROBLEMA DE SENHA

## O Problema
Quando um admin edita a senha de outro usuário, a senha NÃO está sendo salva no Supabase Auth.

## A Solução
Você precisa implantar a Edge Function no Supabase. Sem isso, o código não funciona.

## 📋 PASSO A PASSO (5 minutos)

### 1️⃣ Abra o Dashboard do Supabase
- Vá para: https://supabase.com/dashboard
- Selecione seu projeto

### 2️⃣ Crie a Edge Function
- No menu lateral, clique em **Edge Functions**
- Clique no botão **New Function**
- Nome: `update-user-password`
- Clique em **Create**

### 3️⃣ Copie o código
- Abra o arquivo: `supabase/functions/update-user-password/index.ts` no seu projeto
- Selecione TODO o código e copie (Ctrl+C)

### 4️⃣ Cole o código
- No editor do Supabase Dashboard, apague qualquer código existente
- Cole o código que você copiou (Ctrl+V)
- Clique em **Save**

### 5️⃣ Implante a função
- Clique no botão **Deploy**
- Aguarde a implantação completar (10-30 segundos)
- Você verá um check verde quando terminar

### 6️⃣ Configure a Service Role Key
- Na página da Edge Function, clique na aba **Settings**
- Encontre a seção **Environment Variables**
- Clique em **Add Variable**
- Nome: `SUPABASE_SERVICE_ROLE_KEY`
- Valor: (veja como obter no passo 7)
- Clique em **Save**

### 7️⃣ Obtenha sua Service Role Key
- No Supabase Dashboard, vá em **Settings** (menu lateral)
- Clique em **API**
- Role para baixo até **Project API keys**
- Encontre a chave **service_role**
- Clique no botão **Copy** ao lado dela
- Cole este valor no passo 6

### 8️⃣ Teste a correção
- Atualize sua aplicação (F5)
- Faça login como administrador
- Vá para a página de Usuários
- Edite um usuário existente
- Digite uma nova senha no campo de senha
- Clique em **Salvar Alterações**
- Faça logout
- Tente fazer login como esse usuário com a nova senha

## ✅ Como saber se funcionou

Se tudo estiver correto:
- Você verá a mensagem "Usuário atualizado."
- O usuário conseguirá fazer login com a nova senha
- Nenhuma mensagem de erro aparecerá

## ❌ Se ainda der erro

### Erro: "Edge Function not deployed"
**Solução:** Você não completou o passo 5 (Deploy a função)

### Erro: "SUPABASE_SERVICE_ROLE_KEY not set"
**Solução:** Você não completou o passo 6 (Configure a Service Role Key)

### Erro: "Only administrators can update other users' passwords"
**Solução:** Certifique-se de que está logado como um usuário administrador

## 📝 Resumo

✅ Código criado em `supabase/functions/update-user-password/index.ts`
✅ `services/usuariosService.ts` atualizado para chamar a Edge Function
✅ `pages/Users.tsx` atualizado para passar a senha ao editar
⏳ **VOCÊ PRECISA IMPLANTAR A EDGE FUNCTION (passos 1-7 acima)**

Depois de completar esses passos, a atualização de senha funcionará!
