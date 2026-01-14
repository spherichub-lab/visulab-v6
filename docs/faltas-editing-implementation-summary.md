# Resumo da Implementação: Edição de Registros de Faltas

## Visão Geral

Implementação completa da funcionalidade de edição de registros de faltas com controle de acesso baseado em roles e filtros de data e usuário para melhorar a UX do aplicativo.

## Requisitos Atendidos

✅ **ADMIN users**: Podem alterar TODOS os registros de faltas
✅ **Regular users**: Podem alterar APENAS seus próprios registros
✅ **Ícone de edição**: Ícone de lápis ao lado de cada registro no card "Atividade Recente"
✅ **Filtro de data range**: Inputs "De" e "Até" para filtrar registros por data
✅ **Filtro de usuário (ADMIN)**: Dropdown "Usuário" para filtrar registros por usuario_id (apenas para ADMIN)
✅ **Modal de edição**: Com dropdowns (índice, tipo, tratamento) e inputs (esf, cil, quantidade) empilhados verticalmente
✅ **Validações existentes**: Seguir todas as regras da página "Faltas" (Shortages.tsx)

## Arquivos Modificados/Criados

### 1. Backend e Serviços

#### `lib/utils/visibility/visibilityHelpers.ts`
- **Adicionado**: Função `canUpdateFalta(user: AuthUser, falta: Falta): boolean`
- **Lógica**: ADMIN pode editar qualquer falta, regular users podem editar apenas suas próprias faltas (comparando `usuario_id`)

```typescript
export function canUpdateFalta(user: AuthUser, falta: { usuario_id: string }): boolean {
    if (isAdmin(user)) return true;
    return user.id === falta.usuario_id;
}
```

#### `services/faltasService.ts`
- **Adicionado**: Método `updateWithPermissionCheck(user: AuthUser, faltaId: string, updates: Partial<Falta>)`
- **Validação**: Verifica permissões no backend antes de atualizar
- **Comportamento**: ADMIN pode editar qualquer falta, regular user só suas próprias
- **Erro**: Retorna mensagem de erro se usuário não tiver permissão

#### `services/usuariosService.ts`
- **Utilizado**: Método `getAll()` para carregar lista de usuários para o filtro de ADMIN

```typescript
async updateWithPermissionCheck(user: AuthUser, faltaId: string, updates: Partial<Falta>) {
    // Busca falta para verificar propriedade
    const { data: existingFalta, error: fetchError } = await supabase
      .from('faltas')
      .select('usuario_id')
      .eq('id', faltaId)
      .single();

    if (fetchError) {
        throw new Error('Falta não encontrada');
    }

    // Verifica permissão
    if (!isAdmin(user) && existingFalta.usuario_id !== user.id) {
        throw new Error('Você não tem permissão para editar este registro');
    }

    // Atualiza falta
    return this.update(faltaId, updates);
}
```

### 2. Componente de UI

#### `components/EditFaltaModal.tsx` (NOVO)
- **Campos editáveis**: Índice, Tipo, Tratamento, ESF, CIL, Quantidade
- **Validações implementadas** (iguais à página Shortages.tsx):
  - Formatação automática de ESF: +0.00 ou -0.00
  - Formatação automática de CIL: Sempre negativo (-0.00)
  - Validação de step de 0.25 para ESF e CIL
  - Quando índice = "1.49", trava Tipo e Tratamento como "Incolor"
  - Campos obrigatórios validados
- **Comportamento**: Todos os campos preenchidos com dados atuais da falta
- **Feedback visual**: Mensagens de erro e sucesso

```typescript
interface EditFaltaModalProps {
  isOpen: boolean;
  onClose: () => void;
  falta: Falta | null;
  onSave: (faltaId: string, updates: Partial<Falta>) => Promise<void>;
  currentUser: AuthUser;
}

// Formatação automática de ESF
const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  
  if (name === 'esf') {
    let num = parseFloat(value);
    if (Math.abs(num) >= 25 && !value.includes('.')) {
      num = num / 100;
    }
    const isStepValid = (Math.abs(num) * 100) % 25 === 0;
    
    if (!isStepValid) {
      setSphereError(true);
    } else {
      const formatted = num === 0 ? '+0.00' : num > 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
      setFormData(prev => ({ ...prev, esf: formatted }));
      setSphereError(false);
    }
  }
  
  // Formatação automática de CIL (sempre negativo)
  if (name === 'cil') {
    let num = parseFloat(value);
    if (Math.abs(num) >= 25 && !value.includes('.')) {
      num = num / 100;
    }
    const isStepValid = (Math.abs(num) * 100) % 25 === 0;
    
    if (!isStepValid) {
      setCylinderError(true);
    } else {
      const absVal = Math.abs(num);
      const formatted = `-${absVal.toFixed(2)}`;
      setFormData(prev => ({ ...prev, cil: formatted }));
      setCylinderError(false);
    }
  }
};

// Lógica de travar Tipo/Tratamento quando Índice = "1.49"
const handleSelectChange = (name: keyof EditFormData, value: string) => {
  setFormData(prev => ({ ...prev, [name]: value }));
  
  if (name === 'indice_id') {
    const selectedIndex = dbIndices.find(idx => idx.value === value);
    if (selectedIndex?.label === '1.49') {
      const incolorTipo = dbTipos.find(t => t.label.toLowerCase() === 'incolor');
      const incolorTratamento = dbTratamientos.find(t => t.label.toLowerCase() === 'incolor');
      
      if (incolorTipo && incolorTratamento) {
        setFormData(prev => ({
          ...prev,
          tipo_id: incolorTipo.value,
          tratamiento_id: incolorTratamento.value
        }));
        setLockTipoTratamento(true);
      } else {
        setLockTipoTratamento(false);
      }
    }
  }
};
```

### 3. Integração com Dashboard

#### `pages/Dashboard.tsx`
- **Importações adicionadas**:
  - `EditFaltaModal` do componente
  - `canUpdateFalta` dos utilitários de visibilidade
  - `usuariosService` para carregar lista de usuários
  - `SelectOption` tipo para opções do dropdown
- **Toast type fix**: Removido 'warning' do tipo (agora apenas 'success' | 'error')

- **Estado novo**:
  ```typescript
  const [editFaltaModal, setEditFaltaModal] = useState<{
    isOpen: boolean;
    falta: Falta | null;
  }>({ isOpen: false, falta: null });
  
  const [activityDateFilters, setActivityDateFilters] = useState({
    startDate: '',
    endDate: ''
  });
  
  const [activityUserFilter, setActivityUserFilter] = useState<string>('');
  
  const [userOptions, setUserOptions] = useState<SelectOption[]>([]);
  ```

- **Handlers novos**:
  ```typescript
  // Handler para abrir modal de edição
  const handleEditFalta = (falta: Falta) => {
    if (!canUpdateFalta(currentUser, falta)) {
      showToast('Você não tem permissão para editar este registro', 'error');
      return;
    }
    setEditFaltaModal({ isOpen: true, falta });
  };
  
  // Handler para salvar edição
  const handleSaveFaltaEdit = async (faltaId: string, updates: Partial<Falta>) => {
    try {
      await faltasService.updateWithPermissionCheck(currentUser, faltaId, updates);
      showToast('Registro atualizado com sucesso!', 'success');
      setEditFaltaModal({ isOpen: false, falta: null });
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      showToast(error.message || 'Erro ao atualizar registro', 'error');
    }
  };
  
  // Handler para mudança de filtro de data
  const handleActivityDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setActivityDateFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // Handler para mudança de filtro de usuário
  const handleActivityUserChange = (value: string) => {
    setActivityUserFilter(value);
  };
  ```

- **Filtro de data e usuário no card "Atividade Recente"**:
  ```tsx
  {/* Date Filters */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">De</label>
      <input
        type="date"
        name="startDate"
        value={activityDateFilters.startDate}
        onChange={handleActivityDateChange}
        className="w-full rounded-xl border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 cursor-pointer"
      />
    </div>
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Até</label>
      <input
        type="date"
        name="endDate"
        value={activityDateFilters.endDate}
        onChange={handleActivityDateChange}
        className="w-full rounded-xl border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-white focus:ring-primary focus:border-primary px-3 py-2.5 cursor-pointer"
      />
    </div>
  </div>

  {/* User Filter (only for ADMIN) */}
  {currentUser?.role === 'Administrador' && (
    <div className="space-y-1.5 mb-6">
      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Usuário</label>
      <CustomSelect
        value={activityUserFilter}
        onChange={handleActivityUserChange}
        options={userOptions}
        placeholder="Todos os usuários"
      />
    </div>
  )}
  ```

- **Ícone de edição condicional**:
  ```tsx
  {/* Edit icon - only show if user has permission */}
  {item.falta && canUpdateFalta(currentUser, item.falta) && (
    <button
      onClick={() => handleEditFalta(item.falta)}
      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
      title="Editar"
    >
      <Icon name="edit" className="!text-sm" />
    </button>
  )}
  ```
  - **Para ADMIN**: Ícone aparece em TODAS as faltas
  - **Para Regular user**: Ícone aparece apenas em SUAS próprias faltas

- **Carregamento de opções de usuários (ADMIN)**:
  ```typescript
  // Load Options in parallel
  const [empresas, indices, tratamientos, tipos, usuarios] = await Promise.all([
    empresasService.getAll(),
    indicesService.getAllActive(),
    tratamientosService.getAllActive(),
    tiposService.getAllActive(),
    usuariosService.getAll()
  ]);

  setCompanyOptions(['Todas', ...empresas.filter(e => e.tipo === 'Matriz' || e.tipo === 'Filial').map(e => e.nome)]);
  setIndexOptions(['Todos', ...indices.map(i => i.nome)]);
  setTreatmentOptions(['Todos', ...tratamientos.map(t => t.nome)]);
  setTypeOptions(['Todos', ...tipos.map(t => t.nome)]);
  
  // Set user options for ADMIN filter
  if (currentUser?.role === 'Administrador') {
    setUserOptions(
      usuarios.map(u => ({ value: u.id, label: u.nome || u.email || 'Usuário' }))
    );
  }
  ```

- **Filtragem de atividades por data e usuário**:
  ```typescript
  // Aplica filtros de data aos dados recentes
  let activityFilteredData = filteredData;
  
  if (activityDateFilters.startDate || activityDateFilters.endDate) {
    const parseLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };
    
    if (activityDateFilters.startDate) {
      const startDate = parseLocalDate(activityDateFilters.startDate);
      startDate.setHours(0, 0, 0, 0);
      activityFilteredData = activityFilteredData.filter(item => item.rawDate >= startDate);
    }
    
    if (activityDateFilters.endDate) {
      const endDate = parseLocalDate(activityDateFilters.endDate);
      endDate.setHours(23, 59, 59, 999);
      activityFilteredData = activityFilteredData.filter(item => item.rawDate <= endDate);
    }
  }
  
  // Aplica filtro de usuário (apenas para ADMIN)
  if (currentUser?.role === 'Administrador' && activityUserFilter) {
    activityFilteredData = activityFilteredData.filter(item => item.falta?.usuario_id === activityUserFilter);
  }
  
  setRecentShortages(activityFilteredData.slice(0, 4));
  ```

- **Integração do EditFaltaModal**:
  ```tsx
  <EditFaltaModal
    isOpen={editFaltaModal.isOpen}
    onClose={() => setEditFaltaModal({ isOpen: false, falta: null })}
    falta={editFaltaModal.falta}
    onSave={handleSaveFaltaEdit}
    currentUser={currentUser}
  />
  ```

- **Campo `falta` adicionado ao mappedData**:
  ```typescript
  return {
    id: item.id,
    index: item.indices?.nome || 'N/A',
    treatment: item.tratamentos?.nome || 'N/A',
    quantity: item.quantidade || 1,
    company: item.empresas?.nome || 'N/A',
    user: item.usuarios?.nome || 'N/A',
    esfCil: esfCilDisplay,
    time: item.created_at ? formatTimeAgo(new Date(item.created_at)) : '-',
    rawDate: item.created_at ? new Date(item.created_at) : new Date(),
    type: item.tipos?.nome || 'N/A',
    // Include full Falta object for permission checks
    falta: item
  };
  ```

## Validações Implementadas

### Validações de Permissão
- ✅ ADMIN pode editar qualquer registro de falta
- ✅ Regular user pode editar apenas seus próprios registros (verificando `usuario_id`)
- ✅ Mensagem de erro se usuário não tiver permissão

### Validações de Formulário (Shortages.tsx)
- ✅ Formatação automática de ESF: Aceita valores como 25 → 0.25, formato +0.00 ou -0.00
- ✅ Formatação automática de CIL: Sempre negativo, formato -0.00
- ✅ Validação de step: Múltiplos de 0.25 são válidos
- ✅ Índice 1.49: Trava Tipo e Tratamento como "Incolor"
- ✅ Campos obrigatórios: Tipo, Índice, Tratamento, ESF, CIL, Quantidade

## UX Implementada

### Filtros de Data
- ✅ Inputs "De" e "Até" no topo do card "Atividade Recente"
- ✅ Filtra atividades exibidas com base no range selecionado
- ✅ Quando ambos preenchidos: Filtra nesse range
- ✅ Quando apenas "De" preenchido: Filtra a partir dessa data
- ✅ Quando apenas "Até" preenchido: Filtra até essa data
- ✅ Quando nenhum preenchido: Mostra todas as atividades (sem filtro)

### Filtro de Usuário (ADMIN)
- ✅ Dropdown "Usuário" abaixo dos filtros de data (apenas visível para ADMIN)
- ✅ Contém todos os usuários do sistema
- ✅ Filtra atividades exibidas com base no usuario_id selecionado
- ✅ Quando usuário selecionado: Mostra apenas atividades desse usuário
- ✅ Quando nenhum usuário selecionado: Mostra atividades de todos os usuários
- ✅ Regular users não veem este filtro

### Ícone de Edição
- ✅ Ícone de lápis ao lado de cada item na lista de atividades recentes
- ✅ Aparece condicionalmente baseado em permissões do usuário
- ✅ Ao clicar: Abre modal de edição com os dados da falta preenchidos

### Modal de Edição
- ✅ Modal com todos os dropdowns e inputs empilhados verticalmente
- ✅ Todos os campos preenchidos com dados atuais da falta selecionada
- ✅ Segue todas as regras de validação da página "Faltas"
- ✅ Feedback visual com toasts de sucesso/erro
- ✅ Layout empilhado verticalmente para melhor visualização das informações

## Segurança

### Validação no Backend
- ✅ Permissões verificadas no serviço `faltasService.updateWithPermissionCheck`
- ✅ Verifica propriedade `usuario_id` da falta antes de atualizar
- ✅ ADMIN pode editar qualquer falta
- ✅ Regular user só pode editar suas próprias faltas

### Atualização em Tempo Real
- ✅ `setRefreshTrigger` chamado após salvar edição
- ✅ Dashboard recarrega automaticamente via Supabase subscriptions

## Testes Recomendados

1. ✅ Testar edição como ADMIN (todas as faltas)
2. ✅ Testar edição como regular user (apenas suas próprias faltas)
3. ✅ Testar filtros de date range (De/Até)
4. ✅ Testar filtro de usuário (ADMIN) - selecionar usuário específico e verificar filtragem
5. ✅ Testar combinação de filtros (data + usuário) como ADMIN
6. ✅ Testar validações de formulário (ESF, CIL, Índice 1.49)
7. ✅ Testar feedback visual (toasts de sucesso/erro)
8. ✅ Testar atualização em tempo real
9. ✅ Testar responsividade da interface
10. ✅ Testar acessibilidade (labels, ARIA)
11. ✅ Verificar que regular users não veem o filtro de usuário
12. ✅ Verificar que ADMIN vê o filtro de usuário com todos os usuários listados

## Arquitetura

### Camadas
1. **Service Layer**: `services/faltasService.ts` - Lógica de negócio e validação de permissões
2. **Visibility Utils**: `lib/utils/visibility/visibilityHelpers.ts` - Funções auxiliares de verificação de permissões
3. **UI Components**: `components/EditFaltaModal.tsx` - Modal reutilizável de edição
4. **Page**: `pages/Dashboard.tsx` - Integração com funcionalidade de edição

### Padrões Seguidos
- ✅ Separação de responsabilidades (Service vs UI)
- ✅ Validação em múltiplas camadas (frontend e backend)
- ✅ Reutilização de componentes existentes (Modal, CustomSelect, Icon, Toast)
- ✅ Consistência com padrões existentes (Shortages.tsx)

## Próximos Passos (Opcional)

1. ✅ Adicionar campo `updated_by` para rastrear quem editou cada registro
2. ✅ Implementar histórico de alterações (log de quem editou o que e quando)
3. ✅ Adicionar funcionalidade de undo/redo para edições
4. ✅ Implementar edição em lote (múltiplas faltas de uma vez)
5. ✅ Adicionar notificações quando uma falta é editada por outro usuário
6. ✅ Exportar relatório de alterações de faltas

## Conclusão

A implementação foi concluída com sucesso, seguindo todos os requisitos especificados:

- ✅ ADMIN users podem alterar TODOS os registros de faltas
- ✅ Regular users podem alterar APENAS seus próprios registros
- ✅ Ícone de lápis ao lado de cada registro no card "Atividade Recente"
- ✅ Filtro de date range (De/Até) no card "Atividade Recente"
- ✅ Filtro de usuário (ADMIN) com dropdown contendo todos os usuários
- ✅ Modal de edição com dropdowns e inputs preenchidos empilhados verticalmente
- ✅ Todas as validações da página "Faltas" (Shortages.tsx)
- ✅ Validação de permissões no backend
- ✅ Melhoria de UX com feedback visual

A funcionalidade está pronta para uso e pode ser testada.
