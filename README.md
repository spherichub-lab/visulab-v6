# VisuLab

Web application for optical laboratory inventory shortage management.

## Problem
Optical labs frequently face emergency purchases, high logistics costs, and delivery delays due to poor visibility of high-demand lenses.

## Solution
VisuLab transforms daily shortage records into actionable purchase intelligence, enabling:
- Smarter buying decisions
- Cost reduction
- Better customer delivery performance

## Key Features
- Real-time dashboard with KPIs
- Smart shortage logging (optical validations)
- Purchase management
- Multi-company support (HQ / Branch)
- Role-based access control (RBAC)
- Exportable reports
- Real-time updates (Supabase Realtime)

## Tech Stack
Frontend:
- React 18
- TypeScript
- Tailwind CSS
- Vite

Backend:
- Supabase (PostgreSQL, Auth, Realtime)
- Row Level Security (RLS)

Testing:
- Vitest
- Playwright

## Security
- Row Level Security (RLS) at database level
- Role-based permissions (Admin / User)
- Company-level data isolation

## Architecture
- Presentation Layer (React components/pages)
- Service Layer (business logic)
- Repository Layer (data access abstraction)
- Supabase integration with RLS-aware queries

## Getting Started

```bash
npm install
npm run dev
