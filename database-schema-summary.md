# Database Schema Summary
## VisuLab Supabase Tables and Relationships

Generated: 2026-01-04

---

## Tables Overview

### 1. empresas
**Description:** Table for companies (headquarters, branches, and suppliers)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| nome | VARCHAR(255) | NOT NULL, UNIQUE | Company name |
| tipo | VARCHAR(50) | CHECK (tipo IN ('Matriz', 'Filial', 'Fornecedor')) | Company type |
| contato_nome | VARCHAR(255) | - | Contact person name |
| contato_email | VARCHAR(255) | - | Contact email |
| status | VARCHAR(50) | DEFAULT 'Ativa', CHECK (status IN ('Ativa', 'Inativa')) | Status |
| deleted_at | TIMESTAMP WITH TIME ZONE | - | Soft delete timestamp |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Update timestamp |

**Foreign Keys:** None (parent table)

**Referenced By:**
- usuarios.empresa_id
- faltas.empresa_id

---

### 2. usuarios
**Description:** System users, linked to a company

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| nome | VARCHAR(255) | NOT NULL | User name |
| email | VARCHAR(255) | NOT NULL, UNIQUE | User email |
| empresa_id | UUID | REFERENCES empresas(id) | Company reference |
| role | VARCHAR(50) | DEFAULT 'Usuário', CHECK (role IN ('Administrador', 'Usuário')) | User role |
| status | VARCHAR(50) | DEFAULT 'Active', CHECK (status IN ('Active', 'Offline', 'Pending', 'Inactive')) | User status |
| last_active | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last activity timestamp |
| avatar_url | TEXT | - | Avatar URL |
| initials | VARCHAR(10) | - | User initials |
| deleted_at | TIMESTAMP WITH TIME ZONE | - | Soft delete timestamp |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Update timestamp |

**Foreign Keys:**
- empresa_id → empresas.id

**Referenced By:**
- faltas.usuario_id

---

### 3. indices
**Description:** Reference table for lens refraction indices

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| nome | VARCHAR(50) | NOT NULL, UNIQUE | Index name |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Update timestamp |

**Foreign Keys:** None (reference table)

**Referenced By:**
- faltas.indice_id

---

### 4. tratamentos
**Description:** Reference table for lens treatments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| nome | VARCHAR(255) | NOT NULL, UNIQUE | Treatment name |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Update timestamp |

**Foreign Keys:** None (reference table)

**Referenced By:**
- faltas.tratamiento_id

---

### 5. tipos
**Description:** Reference table for lens types (Incolor, Photo)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| nome | VARCHAR(50) | NOT NULL, UNIQUE | Type name |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Update timestamp |

**Foreign Keys:** None (reference table)

**Referenced By:**
- faltas.tipo_id

---

### 6. faltas
**Description:** Main table for recording lens shortages

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| indice_id | UUID | REFERENCES indices(id) | Index reference |
| tratamiento_id | UUID | REFERENCES tratamientos(id) | Treatment reference |
| tipo_id | UUID | REFERENCES tipos(id) | Type reference |
| empresa_id | UUID | REFERENCES empresas(id) | Company reference |
| usuario_id | UUID | REFERENCES usuarios(id) | User reference |
| esf | DECIMAL(4,2) | NOT NULL | Spherical power |
| cil | DECIMAL(4,2) | NOT NULL | Cylindrical power |
| quantidade | INTEGER | DEFAULT 1 | Quantity |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Update timestamp |

**Foreign Keys:**
- indice_id → indices.id
- tratamiento_id → tratamientos.id
- tipo_id → tipos.id
- empresa_id → empresas.id
- usuario_id → usuarios.id

**Referenced By:** None

---

### 7. compras
**Description:** Table for recording lens purchases

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| fornecedor | VARCHAR(255) | NOT NULL | Supplier name |
| data_compra | DATE | NOT NULL | Purchase date |
| valor_total | DECIMAL(10,2) | NOT NULL | Total value |
| status | VARCHAR(50) | DEFAULT 'Pendente', CHECK (status IN ('Pendente', 'Pago', 'Cancelado')) | Status |
| descricao | TEXT | - | Description |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Update timestamp |

**Foreign Keys:** None

**Referenced By:** None

---

## Entity Relationship Diagram

```
empresas (1) ----< (N) usuarios
    |                    |
    |                    v
    |                 faltas (N)
    |                    ^
    |                    |
    +-------------------+
    
indices (1) ----< (N) faltas
tratamientos (1) --< (N) faltas
tipos (1) --------< (N) faltas

compras (standalone table)
```

---

## RLS Policies Summary

- Access to data is controlled by Row Level Security (RLS)
- `auth.uid()` returns the ID of the logged-in user
- `auth.is_admin()` returns `true` if the logged-in user has role 'Administrador'
- Regular users can only see and manipulate data from their own company (`empresa_id`)
- Only administrators can manage users, companies, and purchases
- Reference tables (`indices`, `tratamientos`, `tipos`) are readable by all, but only administrators can write to them

---

## Enums

### user_role
- 'admin'
- 'user'
- 'viewer'

### status
- 'Ativa'
- 'Inativa'

### usuario_status
- 'Active'
- 'Offline'
- 'Pending'
- 'Inactive'

### compra_status
- 'Pendente'
- 'Pago'
- 'Cancelado'

---

## Notes

1. **Soft Delete:** Tables `empresas` and `usuarios` support soft delete via `deleted_at` column
2. **Naming Convention:** 
   - Database table for treatments is `tratamientos` (Spanish)
   - Frontend uses `tratamento` (Portuguese)
   - Generated types use `Tratamiento` for consistency with DB
3. **RLS:** All queries should respect RLS policies - no hardcoded IDs should bypass this
4. **Timestamps:** All tables have `created_at` and `updated_at` for auditing
