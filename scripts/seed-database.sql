-- Seed minimal test data for VisuLab Supabase database
-- This script creates basic reference data and test records

-- Clear existing data (optional - comment out if you want to preserve existing data)
-- DELETE FROM faltas;
-- DELETE FROM compras;
-- DELETE FROM usuarios;
-- DELETE FROM empresas;
-- DELETE FROM indices;
-- DELETE FROM tratamientos;
-- DELETE FROM tipos;

-- 1. Seed Reference Tables
-- ========================

-- Indices (Lens refraction indices)
INSERT INTO indices (id, nome, created_at, updated_at) VALUES
  ('idx-1', '1.50', NOW(), NOW()),
  ('idx-2', '1.56', NOW(), NOW()),
  ('idx-3', '1.60', NOW(), NOW()),
  ('idx-4', '1.67', NOW(), NOW()),
  ('idx-5', '1.74', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Tipos (Lens types)
INSERT INTO tipos (id, nome, created_at, updated_at) VALUES
  ('tipo-1', 'Incolor', NOW(), NOW()),
  ('tipo-2', 'Photo', NOW(), NOW()),
  ('tipo-3', 'Blue Cut', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Tratamientos (Lens treatments)
INSERT INTO tratamientos (id, nome, created_at, updated_at) VALUES
  ('trat-1', 'Antirreflexo', NOW(), NOW()),
  ('trat-2', 'Antirrisco', NOW(), NOW()),
  ('trat-3', 'Antirreflexo + Antirrisco', NOW(), NOW()),
  ('trat-4', 'Photochromic', NOW(), NOW()),
  ('trat-5', 'Blue Cut', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Empresas
-- ================

INSERT INTO empresas (id, nome, tipo, contato_nome, contato_email, status, created_at, updated_at) VALUES
  ('emp-1', 'VisuLab Matriz', 'Matriz', 'João Silva', 'contato@visulab.com', 'Ativa', NOW(), NOW()),
  ('emp-2', 'VisuLab Filial Centro', 'Filial', 'Maria Santos', 'centro@visulab.com', 'Ativa', NOW(), NOW()),
  ('emp-3', 'Essilor International', 'Fornecedor', 'Carlos Oliveira', 'vendas@essilor.com', 'Ativa', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Usuarios
-- ================

INSERT INTO usuarios (id, nome, email, empresa_id, role, status, last_active, initials, created_at, updated_at) VALUES
  ('usr-1', 'Administrador Sistema', 'admin@visulab.com', 'emp-1', 'admin', 'Active', NOW(), 'AS', NOW(), NOW()),
  ('usr-2', 'João Silva', 'joao@visulab.com', 'emp-1', 'user', 'Active', NOW(), 'JS', NOW(), NOW()),
  ('usr-3', 'Maria Santos', 'maria@visulab.com', 'emp-2', 'user', 'Active', NOW(), 'MS', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Compras
-- ===============

INSERT INTO compras (id, fornecedor, data_compra, valor_total, status, descricao, created_at, updated_at) VALUES
  ('comp-1', 'Essilor International', '2026-01-01', 5000.00, 'Pago', '100x Lentes 1.50 Incolor Antirreflexo', NOW(), NOW()),
  ('comp-2', 'Hoya Corporation', '2026-01-02', 3500.00, 'Pago', '50x Lentes 1.56 Photo', NOW(), NOW()),
  ('comp-3', 'Zeiss Vision', '2026-01-03', 7500.00, 'Pendente', '150x Lentes 1.67 Blue Cut', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Faltas
-- ==============

INSERT INTO faltas (id, usuario_id, empresa_id, tipo_id, indice_id, tratamiento_id, esf, cil, quantidade, created_at, updated_at) VALUES
  ('fal-1', 'usr-2', 'emp-1', 'tipo-1', 'idx-2', 'trat-1', -1.50, -0.75, 2, NOW(), NOW()),
  ('fal-2', 'usr-2', 'emp-1', 'tipo-2', 'idx-3', 'trat-4', -2.00, -1.00, 1, NOW(), NOW()),
  ('fal-3', 'usr-3', 'emp-2', 'tipo-1', 'idx-2', 'trat-1', -1.00, -0.50, 3, NOW(), NOW()),
  ('fal-4', 'usr-3', 'emp-2', 'tipo-3', 'idx-4', 'trat-5', -3.00, -1.50, 1, NOW(), NOW()),
  ('fal-5', 'usr-2', 'emp-1', 'tipo-2', 'idx-5', 'trat-3', -4.00, -2.00, 2, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Summary
-- ========
-- This seed creates:
-- - 5 indices (lens refraction indices)
-- - 3 tipos (lens types)
-- - 5 tratamientos (lens treatments)
-- - 3 empresas (1 Matriz, 1 Filial, 1 Fornecedor)
-- - 3 usuarios (1 admin, 2 users)
-- - 3 compras (purchase orders)
-- - 5 faltas (lens shortage records)

-- Test Credentials (for local development):
-- Admin: admin@visulab.com (empresa: VisuLab Matriz)
-- User 1: joao@visulab.com (empresa: VisuLab Matriz)
-- User 2: maria@visulab.com (empresa: VisuLab Filial Centro)
