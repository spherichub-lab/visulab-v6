
import { User, Company, Purchase } from '../../types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@visulab.com', company: 'Matriz', role: 'Administrador', status: 'Active', lastActive: 'Agora', initials: 'AD', avatarUrl: '' },
  { id: '2', name: 'João Silva', email: 'joao@oticas.com', company: 'Óticas Vision', role: 'Usuário', status: 'Active', lastActive: '2 horas atrás', initials: 'JS' },
  { id: '3', name: 'Maria Souza', email: 'maria@lab.com', company: 'Laboratório Central', role: 'Usuário', status: 'Inactive', lastActive: '5 dias atrás', initials: 'MS' },
];

export const MOCK_COMPANIES: Company[] = [
   { id: '1', name: 'Matriz', displayId: '#CP-0001', type: 'Matriz', contactName: 'Roberto', contactEmail: 'admin@visulab.com', status: 'Active', initials: 'MT', colorClass: 'bg-slate-900 text-white' },
   { id: '2', name: 'Óticas Vision', displayId: '#CP-0002', type: 'Filial', contactName: 'Gerente João', contactEmail: 'contato@vision.com', status: 'Active', initials: 'OV', colorClass: 'bg-blue-100 text-blue-600' },
   { id: '3', name: 'Laboratório Central', displayId: '#CP-0003', type: 'Fornecedor', contactName: 'Sup. Maria', contactEmail: 'maria@lab.com', status: 'Active', initials: 'LC', colorClass: 'bg-emerald-100 text-emerald-600' },
];

export const MOCK_PURCHASES: Purchase[] = [
    { id: '1', displayId: '#PO-1001', supplier: 'Essilor International', supplierInitials: 'E', supplierColorClass: 'bg-blue-100 text-blue-600', date: '2023-10-24', itemsDescription: '50x Lentes Varilux', amount: 4500.00, status: 'Received' },
    { id: '2', displayId: '#PO-1002', supplier: 'Hoya Corporation', supplierInitials: 'H', supplierColorClass: 'bg-purple-100 text-purple-600', date: '2023-10-25', itemsDescription: '30x Blocos VS', amount: 2100.50, status: 'Pending' },
];

export const MOCK_SHORTAGES = [
    { index: '1.56', esfCil: '+2.00 -1.00', user: 'Admin User', treatment: 'HMC', company: 'Matriz', time: 'Há 5 min', quantity: 2, type: 'Visão Simples' },
    { index: '1.49', esfCil: '-1.50 -0.50', user: 'João Silva', treatment: 'Blue Cut', company: 'Óticas Vision', time: 'Há 1 hora', quantity: 1, type: 'Visão Simples' },
    { index: '1.67', esfCil: '+4.00 -2.00', user: 'Maria Souza', treatment: 'AR Premium', company: 'Laboratório Central', time: 'Há 3 horas', quantity: 1, type: 'Multifocal' },
    { index: '1.59', esfCil: 'Plano -0.75', user: 'Admin User', treatment: 'Incolor', company: 'Matriz', time: 'Há 1 dia', quantity: 4, type: 'Visão Simples' },
];
