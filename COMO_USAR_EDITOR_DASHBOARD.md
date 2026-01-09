# 🎯 COMO USAR O EDITOR DO DASHBOARD DO SUPABASE

## Passo 1: Acesse o Dashboard
1. Abra o navegador e vá para: https://supabase.com/dashboard
2. Faça login na sua conta
3. Clique no seu projeto

## Passo 2: Vá para Edge Functions
1. No menu lateral à esquerda, procure por **"Edge Functions"**
2. Clique nele

## Passo 3: Crie uma nova função
1. Clique no botão que diz **"New Function"** (ou "+ New Function")
2. Vai abrir uma janela pedindo o nome da função
3. Digite exatamente: `update-user-password`
4. Clique em **"Create"** ou **"OK"**

## Passo 4: Abra o editor
1. Depois de criar, você verá a função na lista
2. Clique no nome da função: `update-user-password`
3. Vai abrir um editor de código

## Passo 5: Copie o código do seu projeto
1. No seu projeto, abra o arquivo: `supabase/functions/update-user-password/index.ts`
2. Selecione TODO o código (Ctrl+A)
3. Copie (Ctrl+C)

## Passo 6: Cole no editor do Supabase
1. No editor do Dashboard, apague qualquer código que já estiver lá
2. Cole o código que você copiou (Ctrl+V)
3. Verifique se o código está completo

## Passo 7: Salve e implante
1. Procure o botão **"Save"** ou **"Deploy"**
2. Clique nele
3. Aguarde alguns segundos (10-30 segundos)
4. Você deve ver uma mensagem de sucesso ou um ícone verde ✓

## Passo 8: Configure a Service Role Key
1. Na página da função, procure por uma aba chamada **"Settings"** ou **"Configurações"**
2. Clique nessa aba
3. Procure por uma seção chamada **"Environment Variables"** ou **"Variáveis de Ambiente"**
4. Clique em **"Add Variable"** ou **"Adicionar Variável"**
5. No campo "Name" ou "Nome", digite: `SUPABASE_SERVICE_ROLE_KEY`
6. No campo "Value" ou "Valor", você precisa colocar sua service role key (veja como obter no Passo 9)
7. Clique em **"Save"** ou **"Salvar"**

## Passo 9: Obtenha sua Service Role Key
1. No menu lateral, clique em **"Settings"** (ícone de engrenagem ⚙️)
2. Clique em **"API"**
3. Role para baixo até encontrar **"Project API keys"**
4. Procure pela chave chamada **"service_role"**
5. Ao lado dela, clique no botão de copiar 📋
6. Cole este valor no Passo 8, campo "Value"

## Passo 10: Teste
1. Volte para sua aplicação
2. Atualize a página (F5)
3. Faça login como administrador
4. Vá para a página de Usuários
5. Edite um usuário
6. Digite uma nova senha
7. Clique em **Salvar Alterações**
8. Faça logout
9. Tente fazer login como esse usuário com a nova senha

## ✅ Como saber que funcionou

Se tudo estiver correto:
- Você verá a mensagem "Usuário atualizado." (sem erro)
- O usuário conseguirá fazer login com a nova senha
- Nenhuma mensagem de erro aparecerá

## 🔍 Se ainda der erro

### Erro: "Edge Function not deployed"
**Significado:** A função não foi implantada
**Solução:** Volte ao Passo 7 e clique em "Deploy" novamente

### Erro: "SUPABASE_SERVICE_ROLE_KEY not set"
**Significado:** A variável de ambiente não foi configurada
**Solução:** Volte ao Passo 8 e adicione a variável

### Erro: "Only administrators can update other users' passwords"
**Significado:** Você não está logado como administrador
**Solução:** Faça logout e login com um usuário administrador

## 📝 Resumo Rápido

1. Dashboard → Edge Functions → New Function → Nome: `update-user-password`
2. Copie código de `supabase/functions/update-user-password/index.ts`
3. Cole no editor e clique em Deploy
4. Settings → Add Variable → `SUPABASE_SERVICE_ROLE_KEY` = sua-chave
5. Teste editando um usuário com nova senha

**Depois de fazer isso, a atualização de senha vai funcionar!** 🎉
