# Plano: Corrigir Data da Última Compra no Dashboard

## Problema
O card "Última Compra" no dashboard não está atualizando com a data da compra mais recente. Quando uma nova compra é registrada, a data exibida permanece antiga.

## Análise Técnica

### Código Atual
- **Localização**: [`pages/Dashboard.tsx`](pages/Dashboard.tsx)
- **Linhas relevantes**: 194-208

```typescript
// Linha 194: Busca compras
const [dbData, compras] = await Promise.all([
  faltasService.getByUserVisibility(currentUser),
  comprasService.getAll()
]);

// Linhas 205-208: Define a última data de compra
if (compras.length > 0) {
  const sorted = [...compras].sort((a, b) => new Date(b.data_compra).getTime() - new Date(a.data_compra).getTime());
  setLastPurchaseDate(format(new Date(sorted[0].data_compra), 'dd/MM/yy'));
}
```

### Serviço de Compras
- **Localização**: [`services/comprasService.ts`](services/comprasService.ts)
- **Linha 12**: Já ordena por `data_compra` em ordem decrescente

```typescript
const { data, error } = await supabase
  .from('compras')
  .select('*')
  .order('data_compra', { ascending: false });
```

### Real-time Subscription
- **Linhas 371-393**: Configurado corretamente para ouvir mudanças na tabela `compras`
- **Linha 384**: Dispara `setRefreshTrigger(prev => prev + 1)` quando há mudanças

## Causa Raiz Identificada

1. **Ordenação Redundante**: O dashboard faz uma ordenação manual (linha 206) que é desnecessária pois o serviço já ordena
2. **Possível Race Condition**: O real-time subscription pode disparar antes que o novo registro seja completamente persistido
3. **Cache de Dados**: Pode haver um delay entre a inserção e a disponibilidade dos dados na consulta

## Solução Proposta

### Opção 1: Otimizar o Código (Recomendada)
Remover a ordenação redundante e confiar na ordenação do serviço:

**Arquivo**: [`pages/Dashboard.tsx`](pages/Dashboard.tsx)

**Alterações**:
```typescript
// Linhas 204-208 - ATUAL
if (compras.length > 0) {
  const sorted = [...compras].sort((a, b) => new Date(b.data_compra).getTime() - new Date(a.data_compra).getTime());
  setLastPurchaseDate(format(new Date(sorted[0].data_compra), 'dd/MM/yy'));
}

// Linhas 204-208 - NOVO
if (compras.length > 0) {
  // O serviço já ordena por data_compra descending, então o primeiro item é o mais recente
  setLastPurchaseDate(format(new Date(compras[0].data_compra), 'dd/MM/yy'));
}
```

**Benefícios**:
- Remove código redundante
- Melhora performance (evita ordenação desnecessária)
- Mais claro e manutenível

### Opção 2: Adicionar Logging de Debug
Adicionar logs para rastrear quando os dados são atualizados:

**Arquivo**: [`pages/Dashboard.tsx`](pages/Dashboard.tsx)

**Alterações**:
```typescript
// Após linha 208
console.log('📅 [DASHBOARD] Última compra:', {
  totalCompras: compras.length,
  ultimaData: compras.length > 0 ? compras[0].data_compra : 'N/A',
  dataFormatada: lastPurchaseDate,
  timestamp: new Date().toISOString()
});
```

### Opção 3: Forçar Refresh Após Criação de Compra
Adicionar um refresh explícito após criar uma compra:

**Arquivo**: [`pages/Purchases.tsx`](pages/Purchases.tsx)

**Alterações**:
```typescript
// Após linha 212 - Adicionar evento customizado
window.dispatchEvent(new CustomEvent('compra-atualizada'));

// No Dashboard.tsx - Adicionar listener
useEffect(() => {
  const handleCompraAtualizada = () => {
    console.log('🔄 [DASHBOARD] Compra atualizada - forçando refresh');
    setRefreshTrigger(prev => prev + 1);
  };

  window.addEventListener('compra-atualizada', handleCompraAtualizada);
  return () => window.removeEventListener('compra-atualizada', handleCompraAtualizada);
}, []);
```

## Plano de Implementação

### Passo 1: Otimizar o Código (Opção 1)
- [ ] Remover ordenação redundante no Dashboard.tsx
- [ ] Adicionar logging de debug para rastrear atualizações
- [ ] Testar criação de nova compra e verificar se o card atualiza

### Passo 2: Verificar Real-time Subscription
- [ ] Confirmar que o subscription está funcionando corretamente
- [ ] Verificar logs do console para ver se eventos são recebidos
- [ ] Testar com diferentes cenários (criar, editar, excluir)

### Passo 3: Implementar Solução de Backup (se necessário)
- [ ] Se Opção 1 não resolver, implementar Opção 3 (evento customizado)
- [ ] Testar novamente
- [ ] Documentar a solução final

## Critérios de Sucesso

1. ✅ Quando uma nova compra é registrada, o card "Última Compra" mostra a data atualizada
2. ✅ A atualização acontece em tempo real ou com delay mínimo (< 2 segundos)
3. ✅ O código está otimizado sem redundâncias
4. ✅ Logs de console ajudam a debugar problemas futuros

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Real-time subscription não funcionar | Baixa | Alto | Implementar evento customizado como backup |
| Ordenação do serviço mudar no futuro | Baixa | Médio | Manter ordenação no dashboard como fallback |
| Performance impactada | Muito Baixa | Baixo | A ordenação já é O(n log n) para n pequeno |

## Próximos Passos

1. Implementar a Opção 1 (otimização)
2. Testar com criação de novas compras
3. Verificar logs do console
4. Se necessário, implementar Opção 3 (evento customizado)
5. Documentar a solução final
