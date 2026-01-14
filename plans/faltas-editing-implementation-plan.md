# Plan: Implementação de Edição de Registros de Faltas

## Visão Geral

Implementar funcionalidade de edição de registros de faltas com controle de acesso baseado em roles, filtros de data e interface intuitiva seguindo as regras existentes na página "Faltas".

## Requisitos

### Funcionalidades
1. **ADMIN users**: Podem alterar TODOS os registros de faltas
2. **Regular users**: Podem alterar APENAS seus próprios registros
3. **Ícone de edição**: Ícone de lápis ao lado de cada registro no card "Atividade Recente"
4. **Filtro de data range**: "De" e "Até" para filtrar registros por data no card "Atividade Recente"
5. **Modal de edição**: Com dropdowns (índice, tipo, tratamento) e inputs (esf, cil, quantidade)
6. **Regras existentes**: Seguir todas as regras de validação da página "Faltas" (Shortages.tsx)

## Arquitetura da Solução

### 1. Camada de Serviço (Service Layer)

#### Arquivo: `services/faltasService.ts`
- **Adicionar método**: `updateWithPermissionCheck(user: AuthUser, faltaId: string, updates: Partial<Falta>)`
- **Validar permissões**:
  - ADMIN: Pode editar qualquer falta
  - Regular user: Só pode editar suas próprias faltas (verificar `usuario_id`)
- **Retornar erro** se usuário não tiver permissão
- **Chamar método existente**: `update(id, updates)` após validação

### 2. Utilitários de Visibilidade (Visibility Utils)

#### Arquivo: `lib/utils/visibility/visibilityHelpers.ts`
- **Adicionar função**: `canUpdateFalta(user: AuthUser, falta: Falta): boolean`
- **Lógica**:
  ```typescript
  export function canUpdateFalta(user: AuthUser, falta: Falta): boolean {
    if (isAdmin(user)) return true;
    return user.id === falta.usuario_id;
  }
  ```

### 3. Componentes de UI

#### 3.1 Modal de Edição de Falta
**Arquivo**: `components/EditFaltaModal.tsx` (NOVO)

**Props**:
- `isOpen: boolean`
- `onClose: () => void`
- `falta: Falta | null`
- `onSave: (faltaId: string, updates: Partial<Falta>) => Promise<void>`
- `currentUser: AuthUser`

**Campos editáveis** (iguais à página Shortages.tsx):
- Índice (dropdown) - `indice_id`
- Tipo (dropdown) - `tipo_id`
- Tratamento (dropdown) - `tratamiento_id`
- Esférico (input text) - `esf`
- Cilíndrico (input text) - `cil`
- Quantidade (input number) - `quantidade`

**Comportamento**:
- Todos os campos devem ser preenchidos com os dados atuais da falta
- Seguir todas as regras de validação da página Shortages.tsx:
  - Formatação automática de ESF e CIL (ex: +0.00, -0.00)
  - Validação de step de 0.25 para ESF e CIL
  - Quando índice = "1.49", travar tipo e tratamento como "Incolor"
  - CIL sempre negativo (formatado como -0.00)
  - ESF pode ser positivo ou negativo

#### 3.2 Atualização do Dashboard
**Arquivo**: `pages/Dashboard.tsx`

**Adicionar ao card "Atividade Recente"**:

1. **Estado novo**:
   ```typescript
   const [editFaltaModal, setEditFaltaModal] = useState<{
     isOpen: boolean;
     falta: Falta | null;
   }>({ isOpen: false, falta: null });
   ```

2. **Estado de filtros de data para atividades recentes**:
   ```typescript
   const [activityDateFilters, setActivityDateFilters] = useState({
     startDate: '',
     endDate: ''
   });
   ```

3. **Função para abrir modal de edição**:
   ```typescript
   const handleEditFalta = (falta: Falta) => {
     // Verificar permissão antes de abrir modal
     if (!canUpdateFalta(currentUser, falta)) {
       showToast('Você não tem permissão para editar este registro', 'error');
       return;
     }
     setEditFaltaModal({ isOpen: true, falta });
   };
   ```

4. **Função para salvar edição**:
   ```typescript
   const handleSaveFaltaEdit = async (faltaId: string, updates: Partial<Falta>) => {
     try {
       await faltasService.updateWithPermissionCheck(currentUser, faltaId, updates);
       showToast('Registro atualizado com sucesso!', 'success');
       setEditFaltaModal({ isOpen: false, falta: null });
       setRefreshTrigger(prev => prev + 1); // Recarregar dados
     } catch (error) {
       showToast('Erro ao atualizar registro', 'error');
     }
   };
   ```

5. **UI do card "Atividade Recente"**:
   - **Adicionar filtros de data** no topo do card:
     - Input "De" (data inicial)
     - Input "Até" (data final)
   - **Adicionar ícone de lápis** ao lado de cada item na lista:
     - Para ADMIN: Mostrar ícone em todas as faltas
     - Para Regular user: Mostrar ícone apenas em suas próprias faltas
   - **Ao clicar no ícone**: Abrir modal de edição com os dados da falta preenchidos

### 4. Atualização de Tipos

#### Arquivo: `lib/types/database/entities.types.ts`
- Verificar se `FaltaUpdate` já inclui todos os campos necessários
- Garantir que tipos estejam corretos

## Fluxo de Implementação

### Fase 1: Backend e Serviços
1. ✅ Adicionar função `canUpdateFalta` em `lib/utils/visibility/visibilityHelpers.ts`
2. ✅ Adicionar método `updateWithPermissionCheck` em `services/faltasService.ts`
3. ✅ Testar validação de permissões

### Fase 2: Componentes de UI
4. ✅ Criar componente `EditFaltaModal.tsx` com:
   - Dropdowns: Índice, Tipo, Tratamento
   - Inputs: ESF, CIL, Quantidade
   - Validações idênticas à página Shortages.tsx
   - Formatação automática de ESF e CIL
   - Lógica de travar Tipo/Tratamento quando Índice = "1.49"

### Fase 3: Integração com Dashboard
5. ✅ Atualizar `Dashboard.tsx` com novo estado
6. ✅ Adicionar filtros de date range (De/Até) no card "Atividade Recente"
7. ✅ Adicionar ícone de lápis ao lado de cada registro:
   - ADMIN: Ícone em todas as faltas
   - Regular user: Ícone apenas em suas próprias faltas
8. ✅ Implementar handlers de edição
9. ✅ Adicionar feedback visual (toasts)

### Fase 4: Testes e Validação
10. ✅ Testar edição como ADMIN (todas as faltas)
11. ✅ Testar edição como regular user (apenas próprias faltas)
12. ✅ Testar filtros de date range
13. ✅ Testar validações de formulário (ESF, CIL, Índice 1.49)
14. ✅ Testar atualização em tempo real (via Supabase subscriptions)

## Detalhes Técnicos

### Ícone de Edição ao Lado de Cada Registro
- **Para ADMIN**: Mostrar ícone de lápis ao lado de TODAS as faltas
- **Para Regular user**: Mostrar ícone de lápis apenas ao lado de SUAS próprias faltas
- **Comportamento**: Ao clicar no ícone, abrir modal de edição com os dados da falta preenchidos

### Filtros de Data
- **Input "De"**: Data inicial do range
- **Input "Até"**: Data final do range
- **Comportamento**:
  - Quando ambos preenchidos: Filtrar faltas nesse range
  - Quando apenas "De" preenchido: Filtrar a partir dessa data
  - Quando apenas "Até" preenchido: Filtrar até essa data
  - Quando nenhum preenchido: Mostrar todas as faltas (sem filtro)

### Validações de Formulário (baseadas em Shortages.tsx)
1. **Índice 1.49**: Tratamento e Tipo obrigatoriamente "Incolor" (travados)
2. **Formatação automática de ESF**:
   - Aceita valores como 25 → converte para 0.25
   - Formato final: +0.00 (positivo) ou -0.00 (negativo)
   - Step válido: múltiplos de 0.25
   - Erro se step inválido
3. **Formatação automática de CIL**:
   - Aceita valores como 25 → converte para 0.25
   - Formato final: SEMPRE negativo (-0.00)
   - Step válido: múltiplos de 0.25
   - Erro se step inválido
4. **Campos obrigatórios**: Tipo, Índice, Tratamento, ESF, CIL, Quantidade
5. **Quantidade**: Deve ser >= 1
6. **Validação em blur**: Aplicar formatação e validação ao perder foco do campo

### Feedback Visual
- **Sucesso**: Toast verde "Registro atualizado com sucesso!"
- **Erro de permissão**: Toast vermelho "Você não tem permissão para editar este registro"
- **Erro de validação**: Toast vermelho com mensagem específica
- **Erro de rede**: Toast vermelho "Erro ao atualizar registro. Tente novamente."

## Considerações de Segurança

1. **Validação no backend**: Sempre verificar permissões no serviço, não apenas no frontend
2. **RLS Policies**: Verificar se políticas RLS do Supabase permitem UPDATE
3. **Auditoria**: Considerar adicionar campo `updated_by` para rastrear quem editou
4. **Timestamp**: Sempre atualizar `updated_at` ao editar

## Melhorias Futuras (Opcional)

1. **Histórico de alterações**: Log de quem editou o que e quando
2. **Undo/Redo**: Capacidade de reverter alterações
3. **Edição em lote**: Editar múltiplas faltas de uma vez
4. **Exportação de alterações**: Relatório de alterações feitas
5. **Notificações**: Avisar quando uma falta é editada por outro usuário

## Estrutura de Arquivos

```
├── components/
│   ├── EditFaltaModal.tsx          [NOVO]
│   └── Modal.tsx                    [EXISTENTE - usar]
├── lib/
│   └── utils/
│       └── visibility/
│           └── visibilityHelpers.ts [ATUALIZAR]
├── pages/
│   └── Dashboard.tsx                [ATUALIZAR]
├── services/
│   └── faltasService.ts             [ATUALIZAR]
└── plans/
    └── faltas-editing-implementation-plan.md [ESTE ARQUIVO]
```

## Checklist de Validação

- [ ] ADMIN pode editar todas as faltas
- [ ] Regular user pode editar apenas suas próprias faltas
- [ ] Ícone de lápis aparece corretamente para ambos os roles
- [ ] Filtros de date range funcionam corretamente
- [ ] Validações de formulário funcionam (ESF, CIL, Índice 1.49)
- [ ] Formatação automática de ESF e CIL funciona corretamente
- [ ] Tratamento e Tipo ficam travados quando Índice = "1.49"
- [ ] Feedback visual (toasts) funciona
- [ ] Atualização em tempo real funciona
- [ ] Interface é responsiva
- [ ] Acessibilidade (labels, ARIA)
- [ ] Tratamento de erros adequado
- [ ] Performance aceitável
- [ ] Código segue padrões do projeto
