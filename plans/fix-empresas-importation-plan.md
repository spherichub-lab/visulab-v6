# Plano de Correção: Importação de Empresas

## Resumo Executivo

Corrigir a incompatibilidade de tipos entre `useGenericListQuery` e os serviços Supabase que impede que as empresas (e outras entidades) sejam exibidas corretamente no aplicativo.

## Problema Identificado

### Causa Raiz
O hook `useGenericListQuery` espera receber um `PaginatedResponse<T>` com estrutura de paginação, mas os serviços Supabase retornam um `ApiResponse<T[]>` simples.

### Impacto
- **Página Companies:** Não exibe as empresas existentes no banco de dados
- **Outras páginas:** Faltas, Compras, Usuários, etc. podem ter o mesmo problema
- **Serviços afetados:** Todos os 8 serviços Supabase (empresas, usuarios, faltas, compras, indices, tipos, tratamentos, tratamientos)

## Arquitetura Atual

```
Companies.tsx
  ↓ usa
useEmpresasList() (hook de domínio)
  ↓ usa
useGenericListQuery() (hook genérico)
  ↓ chama
SupabaseEmpresasService.getAll()
  ↓ retorna
ApiResponse<Empresa[]>  ← INCOMPATÍVEL
  ↑ espera
PaginatedResponse<Empresa>  ← TIPO ESPERADO
```

## Solução Proposta

### Abordagem
Atualizar o `useGenericListQuery` para transformar `ApiResponse<T[]>` em `PaginatedResponse<T>` automaticamente.

### Mudanças Necessárias

#### 1. Atualizar `src/hooks/queries/useGenericListQuery`

**Arquivo:** `src/hooks/queries/useGenericQuery.ts`

**Mudanças:**
```typescript
// Antes (linha 23-41)
export function useGenericListQuery<T>(
    entityType: string,
    service: any,
    options?: QueryOptions,
    queryOptions?: UseGenericQueryOptions<PaginatedResponse<T>, Error>
): UseQueryResult<PaginatedResponse<T>, Error> {
    const queryKeys = createQueryKeys<T>(entityType);
    const queryKey = queryKeys.list(options?.filters);

    return useQuery({
        queryKey,
        queryFn: async () => {
            const response = await service.getAll(options);
            return response.data!;  // ❌ PROBLEMA: response.data é T[], não PaginatedResponse<T>
        },
        ...cachePolicyUtils.createQueryOptions(entityType as any, queryOptions),
        ...queryOptions,
    });
}

// Depois
export function useGenericListQuery<T>(
    entityType: string,
    service: any,
    options?: QueryOptions,
    queryOptions?: UseGenericQueryOptions<PaginatedResponse<T>, Error>
): UseQueryResult<PaginatedResponse<T>, Error> {
    const queryKeys = createQueryKeys<T>(entityType);
    const queryKey = queryKeys.list(options?.filters);

    return useQuery({
        queryKey,
        queryFn: async () => {
            const response = await service.getAll(options);

            // ✅ CORREÇÃO: Transformar ApiResponse<T[]> em PaginatedResponse<T>
            if (!response.success || response.error) {
                throw new Error(response.error?.message || 'Failed to fetch data');
            }

            const data = response.data || [];

            // Criar estrutura de paginação
            return {
                data: data,
                pagination: {
                    page: options?.page || 1,
                    limit: options?.limit || data.length,
                    total: data.length,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false
                }
            };
        },
        ...cachePolicyUtils.createQueryOptions(entityType as any, queryOptions),
        ...queryOptions,
    });
}
```

#### 2. Atualizar `useGenericDetailQuery` (consistência)

**Arquivo:** `src/hooks/queries/useGenericQuery.ts`

**Mudanças:**
```typescript
// Antes (linha 44-63)
export function useGenericDetailQuery<T>(
    entityType: string,
    id: string,
    service: any,
    queryOptions?: UseGenericQueryOptions<T, Error>
): UseQueryResult<T, Error> {
    const queryKeys = createQueryKeys<T>(entityType);
    const queryKey = queryKeys.detail(id);

    return useQuery({
        queryKey,
        queryFn: async () => {
            const response = await service.getById(id);
            return response.data!;  // ❌ PROBLEMA
        },
        enabled: !!id,
        ...cachePolicyUtils.createQueryOptions(entityType as any, queryOptions),
        ...queryOptions,
    });
}

// Depois
export function useGenericDetailQuery<T>(
    entityType: string,
    id: string,
    service: any,
    queryOptions?: UseGenericQueryOptions<T, Error>
): UseQueryResult<T, Error> {
    const queryKeys = createQueryKeys<T>(entityType);
    const queryKey = queryKeys.detail(id);

    return useQuery({
        queryKey,
        queryFn: async () => {
            const response = await service.getById(id);

            // ✅ CORREÇÃO: Verificar sucesso antes de retornar
            if (!response.success || response.error) {
                throw new Error(response.error?.message || 'Failed to fetch data');
            }

            if (!response.data) {
                throw new Error('Data not found');
            }

            return response.data;
        },
        enabled: !!id,
        ...cachePolicyUtils.createQueryOptions(entityType as any, queryOptions),
        ...queryOptions,
    });
}
```

#### 3. Atualizar `useGenericSearchQuery` (consistência)

**Arquivo:** `src/hooks/queries/useGenericQuery.ts`

**Mudanças:**
```typescript
// Antes (linha 66-87)
export function useGenericSearchQuery<T>(
    entityType: string,
    searchQuery: string,
    service: any,
    queryOptions?: UseGenericQueryOptions<PaginatedResponse<T>, Error>
): UseQueryResult<PaginatedResponse<T>, Error> {
    const queryKeys = createQueryKeys<T>(entityType);
    const queryKey = queryKeys.search(searchQuery);

    return useQuery({
        queryKey,
        queryFn: async () => {
            const response = await service.getAll({
                filters: { search: searchQuery }
            });
            return response.data!;  // ❌ PROBLEMA
        },
        enabled: !!searchQuery && searchQuery.length > 0,
        ...cachePolicyUtils.createQueryOptions(entityType as any, queryOptions),
        ...queryOptions,
    });
}

// Depois
export function useGenericSearchQuery<T>(
    entityType: string,
    searchQuery: string,
    service: any,
    queryOptions?: UseGenericQueryOptions<PaginatedResponse<T>, Error>
): UseQueryResult<PaginatedResponse<T>, Error> {
    const queryKeys = createQueryKeys<T>(entityType);
    const queryKey = queryKeys.search(searchQuery);

    return useQuery({
        queryKey,
        queryFn: async () => {
            const response = await service.getAll({
                filters: { search: searchQuery }
            });

            // ✅ CORREÇÃO: Transformar ApiResponse<T[]> em PaginatedResponse<T>
            if (!response.success || response.error) {
                throw new Error(response.error?.message || 'Failed to fetch data');
            }

            const data = response.data || [];

            return {
                data: data,
                pagination: {
                    page: 1,
                    limit: data.length,
                    total: data.length,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false
                }
            };
        },
        enabled: !!searchQuery && searchQuery.length > 0,
        ...cachePolicyUtils.createQueryOptions(entityType as any, queryOptions),
        ...queryOptions,
    });
}
```

## Benefícios da Solução

1. **Correção imediata:** As empresas aparecerão na página Companies
2. **Correção em cascata:** Todas as outras páginas (Faltas, Compras, etc.) também funcionarão
3. **Tratamento de erros:** Melhor feedback visual para o usuário quando há erros
4. **Consistência:** Todos os hooks genéricos funcionarão da mesma forma
5. **Manutenibilidade:** Código mais robusto e fácil de manter

## Testes Necessários

### Teste 1: Página Companies
- [ ] Verificar se as empresas aparecem na tabela
- [ ] Verificar se a contagem de empresas está correta
- [ ] Testar filtros por tipo e status
- [ ] Testar busca por nome
- [ ] Testar criação de nova empresa
- [ ] Testar edição de empresa existente
- [ ] Testar exclusão de empresa
- [ ] Testar ativação/desativação de status

### Teste 2: Outras Páginas
- [ ] Verificar se a página Faltas exibe os dados
- [ ] Verificar se a página Compras exibe os dados
- [ ] Verificar se a página Usuários exibe os dados
- [ ] Verificar se outras páginas funcionam corretamente

### Teste 3: Tratamento de Erros
- [ ] Testar comportamento quando há erro de rede
- [ ] Testar comportamento quando há erro de autenticação
- [ ] Testar comportamento quando não há dados

## Riscos e Mitigações

### Risco 1: Quebra de funcionalidade existente
- **Mitigação:** Testar todas as páginas após a mudança
- **Probabilidade:** Baixa

### Risco 2: Problemas de performance
- **Mitigação:** A transformação é simples e não deve impactar performance
- **Probabilidade:** Muito baixa

### Risco 3: Incompatibilidade com código futuro
- **Mitigação:** A solução é genérica e funcionará com qualquer serviço que retorne ApiResponse
- **Probabilidade:** Baixa

## Próximos Passos

1. Implementar as mudanças no `useGenericListQuery`
2. Implementar as mudanças no `useGenericDetailQuery`
3. Implementar as mudanças no `useGenericSearchQuery`
4. Testar a página Companies
5. Testar as outras páginas
6. Verificar o console do navegador para erros
7. Documentar as mudanças

## Notas Adicionais

- A solução não requer mudanças nos serviços Supabase
- A solução não requer mudanças nas páginas
- A solução é centralizada no hook genérico, facilitando manutenção
- A solução adiciona tratamento de erros adequado
- A solução cria estrutura de paginação mesmo para dados não paginados (total = data.length)
