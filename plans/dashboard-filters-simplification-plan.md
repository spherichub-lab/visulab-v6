# Plano de Simplificação de Filtros do Dashboard

## Objetivo
Simplificar a filtragem de dados no Dashboard:
- Cards KPI e gráficos: Mostrar dados de TODAS as empresas para TODOS os usuários
- Card "Gerar Relatório": Manter filtros funcionais de data, tratamento, índice e empresa

## Análise Atual

### Comportamento Atual
1. **Cards KPI e Gráficos**: Aplicam filtragem por empresa baseada no usuário:
   - Administradores: Veem todas as empresas (podem filtrar)
   - Usuários regulares: Veem apenas sua própria empresa

2. **Card "Gerar Relatório"**: Possui filtros de:
   - Data (início e fim)
   - Índice
   - Tratamento
   - Empresa (apenas para admins)

### Problema
Os filtros estão espalhados e causam confusão. O usuário quer simplificar:
- Dashboard cards: Mostrar dados globais (todas as empresas)
- Apenas o relatório deve ter filtros específicos

## Mudanças Necessárias

### 1. Modificar `fetchDashboardData` em `pages/Dashboard.tsx`

**Localização**: Linhas 176-397

**Mudanças**:
- Remover filtragem por empresa dos dados de cards KPI e gráficos
- Manter apenas filtragem por data
- Todos os usuários (admin e regulares) veem dados de todas empresas nos cards

**Código a ser modificado** (linhas 292-306):
```typescript
// REMOVER este bloco de filtragem por empresa:
// REGULAR USERS: always restricted to their own company
if (!isAdmin(currentUser)) {
  filteredData = filteredData.filter(
    item => item.company === currentUser.company
  );
}
// ADMINS with a specific company selected
else if (analyticsFilters.company !== 'Todas') {
  filteredData = filteredData.filter(
    item => item.company === analyticsFilters.company
  );
}
```

**Novo comportamento**:
- `filteredData` deve incluir dados de todas as empresas
- Apenas filtragem por data deve ser aplicada
- Cards KPI, gráficos e atividade recente mostram dados globais

### 2. Remover filtro de empresa da seção de Analytics

**Localização**: Linhas 634-644

**Mudanças**:
- Remover o componente `CustomSelect` de empresa da seção "Análise de Faltas"
- Remover o `analyticsFilters.company` e lógica relacionada
- Manter apenas filtros de período (Hoje, 7 Dias, 30 Dias, Personalizado)

**Código a ser removido**:
```typescript
{currentUser?.role === 'Administrador' && (
  <div className="min-w-[160px] px-2">
    <CustomSelect
      label="Empresa"
      value={analyticsFilters.company}
      onChange={(val) => handleAnalyticsChange('company', val)}
      options={companyOptions}
      triggerClassName="bg-transparent border-none p-0 !px-0"
    />
  </div>
)}
```

### 3. Simplificar estado `analyticsFilters`

**Localização**: Linhas 139-144

**Mudanças**:
- Remover `company` do estado `analyticsFilters`
- Manter apenas `range`, `customStartDate`, `customEndDate`

**Antes**:
```typescript
const [analyticsFilters, setAnalyticsFilters] = useState({
  company: 'Todas',
  range: '7 Dias',
  customStartDate: '',
  customEndDate: ''
});
```

**Depois**:
```typescript
const [analyticsFilters, setAnalyticsFilters] = useState({
  range: '7 Dias',
  customStartDate: '',
  customEndDate: ''
});
```

### 4. Remover useEffect de inicialização de analyticsFilters

**Localização**: Linhas 147-160

**Mudanças**:
- Remover completamente este useEffect que define a empresa baseada no usuário
- Este filtro não será mais necessário

**Código a ser removido**:
```typescript
useEffect(() => {
  if (currentUser?.role === 'Administrador') {
    setAnalyticsFilters(prev => {
      if (prev.company === 'Todas') return prev;
      return { ...prev, company: 'Todas' };
    });
  } else if (currentUser?.company) {
    setAnalyticsFilters(prev => {
      if (prev.company === currentUser.company) return prev;
      return { ...prev, company: currentUser.company };
    });
  }
}, [currentUser?.role, currentUser?.company]);
```

### 5. Atualizar dependências do useEffect principal

**Localização**: Linhas 400-403

**Mudanças**:
- Remover `analyticsFilters.company` das dependências

**Antes**:
```typescript
useEffect(() => {
  console.log('🎯 [DASHBOARD] Dashboard useEffect triggered with filters:', analyticsFilters);
  fetchDashboardData();
}, [analyticsFilters.company, analyticsFilters.range, analyticsFilters.customStartDate, analyticsFilters.customEndDate, refreshTrigger]);
```

**Depois**:
```typescript
useEffect(() => {
  console.log('🎯 [DASHBOARD] Dashboard useEffect triggered with filters:', analyticsFilters);
  fetchDashboardData();
}, [analyticsFilters.range, analyticsFilters.customStartDate, analyticsFilters.customEndDate, refreshTrigger]);
```

### 6. Card "Gerar Relatório" - Manter filtros funcionais

**Localização**: Linhas 878-952

**Verificação**:
- Filtros de data (startDate, endDate): ✓ Já funcionando
- Filtro de índice: ✓ Já funcionando
- Filtro de tratamento: ✓ Já funcionando
- Filtro de empresa (apenas para admins): ✓ Já funcionando

**Função `handleExportTxt`** (linhas 472-517):
- Já implementa corretamente a filtragem baseada em `reportFilters`
- Não requer modificações

## Fluxo de Dados Atual vs Novo

### Fluxo Atual
```
fetchDashboardData()
  ↓
Busca dados via faltasService.getByUserVisibility(currentUser)
  ↓
Aplica filtros:
  - Empresa (baseada no usuário)
  - Data (analyticsFilters.range)
  ↓
Atualiza cards KPI e gráficos
```

### Novo Fluxo
```
fetchDashboardData()
  ↓
Busca dados via faltasService.getByUserVisibility(currentUser)
  ↓
Aplica filtros:
  - Data (analyticsFilters.range) [APENAS]
  ↓
Atualiza cards KPI e gráficos com dados de TODAS as empresas
```

## Impacto em Componentes

### Cards KPI (Total de Faltas, Faltas Hoje, Maior Falta, Última Compra)
- **Antes**: Mostravam dados filtrados por empresa
- **Depois**: Mostrarão dados de todas as empresas

### Gráfico de Índice de Refração
- **Antes**: Mostrava dados filtrados por empresa
- **Depois**: Mostrará dados de todas as empresas

### Gráfico de Tratamento
- **Antes**: Mostrava dados filtrados por empresa
- **Depois**: Mostrará dados de todas as empresas

### Atividade Recente
- **Antes**: Mostrava dados filtrados por empresa
- **Depois**: Mostrará dados de todas as empresas

### Card "Gerar Relatório"
- **Antes**: Filtros funcionando corretamente
- **Depois**: Sem mudanças - continua funcionando da mesma forma

## Testes Necessários

### 1. Teste como Administrador
- Acessar Dashboard
- Verificar que cards KPI mostram dados de todas as empresas
- Verificar que gráficos mostram dados de todas as empresas
- Verificar que atividade recente mostra dados de todas as empresas
- Usar filtros de data e verificar que funcionam
- Gerar relatório com filtros específicos (data, índice, tratamento, empresa)
- Verificar que o relatório é gerado corretamente

### 2. Teste como Usuário Regular
- Acessar Dashboard
- Verificar que cards KPI mostram dados de todas as empresas (não apenas da sua empresa)
- Verificar que gráficos mostram dados de todas as empresas
- Verificar que atividade recente mostra dados de todas as empresas
- Usar filtros de data e verificar que funcionam
- Gerar relatório com filtros específicos (data, índice, tratamento)
- Verificar que o relatório é gerado corretamente

### 3. Teste de Filtros de Relatório
- Testar filtro de data (início e fim)
- Testar filtro de índice
- Testar filtro de tratamento
- Testar filtro de empresa (apenas para admins)
- Testar combinações de filtros
- Verificar que o arquivo TXT gerado contém apenas os dados filtrados

## Arquivos a Serem Modificados

1. **pages/Dashboard.tsx**
   - Remover filtragem por empresa em `fetchDashboardData`
   - Remover filtro de empresa da UI de Analytics
   - Simplificar estado `analyticsFilters`
   - Remover useEffect de inicialização
   - Atualizar dependências do useEffect principal

## Arquivos NÃO Modificados

1. **services/faltasService.ts**
   - `getByUserVisibility()` continua funcionando da mesma forma
   - A filtragem por empresa acontece no nível do Dashboard, não do serviço

2. **lib/reports/generateTxtReport.ts**
   - Continua funcionando da mesma forma
   - Recebe dados já filtrados pelo Dashboard

## Resumo de Mudanças

| Componente | Antes | Depois |
|------------|-------|--------|
| Cards KPI | Filtrados por empresa | Dados de todas as empresas |
| Gráficos | Filtrados por empresa | Dados de todas as empresas |
| Atividade Recente | Filtrada por empresa | Dados de todas as empresas |
| Filtro de Empresa (Analytics) | Disponível para admins | Removido |
| Filtros de Data | Funcionando | Continua funcionando |
| Card "Gerar Relatório" | Filtros funcionando | Sem mudanças |

## Benefícios

1. **Simplicidade**: Menos filtros para o usuário entender
2. **Visibilidade Global**: Todos veem o panorama completo de todas as empresas
3. **Clareza**: Filtros específicos apenas onde necessário (relatório)
4. **Consistência**: Comportamento uniforme para todos os usuários

## Riscos e Mitigações

### Risco: Usuários podem se confundir com dados globais
**Mitigação**: Documentar claramente que os cards mostram dados de todas as empresas

### Risco: Dados sensíveis visíveis para usuários regulares
**Mitigação**: Confirmar com o usuário se isso é aceitável (parece que sim, baseado no requisito)

### Risco: Performance com muitos dados
**Mitigação**: A filtragem por data continua funcionando, limitando a quantidade de dados exibida

## Checklist de Implementação

- [ ] Modificar `fetchDashboardData` para remover filtragem por empresa
- [ ] Remover filtro de empresa da UI de Analytics
- [ ] Simplificar estado `analyticsFilters`
- [ ] Remover useEffect de inicialização
- [ ] Atualizar dependências do useEffect principal
- [ ] Testar como Administrador
- [ ] Testar como Usuário Regular
- [ ] Testar filtros do relatório
- [ ] Verificar geração de relatório TXT
