
import saveAs from 'file-saver';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportFilter {
  startDate?: string;
  endDate?: string;
  company?: string;
  index?: string;
  treatment?: string;
  type?: string;
  title?: string;
  groupByLabel?: string;
  hideQuantity?: boolean;
}

interface ReportItem {
  index: string;
  esfCil: string;
  treatment: string;
  quantity: number;
  user?: string;
  time?: string;
  type?: string;
}

export const generateTxtReport = (
  filters: ReportFilter,
  data: ReportItem[]
) => {
  const groupLabel = filters.groupByLabel || 'GRUPO';

  let content = '';

  // Header
  content += `${filters.title || 'RELATÓRIO DE FALTAS DE ESTOQUE'}\n`;
  content += '==================================================\n\n';

  // Metadata
  const now = new Date();
  content += `Data: ${format(now, 'dd/MM/yyyy', { locale: ptBR })}\n`;
  content += `Hora: ${format(now, 'HH:mm:ss', { locale: ptBR })}\n\n`;

  content += `Empresa(s): ${filters.company || 'Todas'}\n`;
  if (filters.index && filters.index !== 'Todos') {
    content += `Índice: ${filters.index}\n`;
  }
  if (filters.treatment && filters.treatment !== 'Todos') {
    content += `Tratamento: ${filters.treatment}\n`;
  }
  if (filters.type && filters.type !== 'Todos') {
    content += `Tipo: ${filters.type}\n`;
  }
  if (filters.startDate && filters.endDate) {
    // Parse dates as local time to avoid timezone issues
    const parseLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const startDate = parseLocalDate(filters.startDate);
    const endDate = parseLocalDate(filters.endDate);

    content += `Período: ${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}\n`;
  }
  content += `Total de Itens: ${data.length}\n`;
  content += '__________________________________________________\n\n';

  // Group data
  const groupedData: Record<string, ReportItem[]> = {};

  data.forEach(item => {
    if (!groupedData[item.index]) {
      groupedData[item.index] = [];
    }
    groupedData[item.index].push(item);
  });

  if (Object.keys(groupedData).length === 0) {
    content += '\nNenhum registro encontrado para os filtros selecionados.\n';
  } else {
    // Sort index groups by total quantity (descending)
    const sortedIndexKeys = Object.keys(groupedData).sort((a, b) => {
      const totalA = groupedData[a].reduce((sum, item) => sum + item.quantity, 0);
      const totalB = groupedData[b].reduce((sum, item) => sum + item.quantity, 0);
      return totalB - totalA;
    });

    sortedIndexKeys.forEach(indexKey => {
      const totalQuantity = groupedData[indexKey].reduce((sum, item) => sum + item.quantity, 0);
      content += `\n📍 ${groupLabel}: ${indexKey} (Total: ${totalQuantity})\n\n`;

      // Group items by esfCil + treatment combination to avoid redundancy
      const combinedItems: Record<string, { esfCil: string; treatment: string; quantity: number; type?: string }> = {};

      groupedData[indexKey].forEach(item => {
        const key = `${item.esfCil}|${item.treatment}`;
        if (!combinedItems[key]) {
          combinedItems[key] = {
            esfCil: item.esfCil,
            treatment: item.treatment,
            quantity: 0,
            type: item.type
          };
        }
        combinedItems[key].quantity += item.quantity;
      });

      // Sort combined items by quantity (descending)
      const sortedCombinedItems = Object.values(combinedItems).sort((a, b) => b.quantity - a.quantity);

      sortedCombinedItems.forEach(item => {
        const qtyString = filters.hideQuantity ? '' : ` (${item.quantity})`;
        // Add "Photo " before treatment if type is "Photo"
        const treatmentDisplay = (item.type && item.type.toLowerCase() === 'photo')
          ? `Photo ${item.treatment}`
          : item.treatment;
        const line = `${item.esfCil.padEnd(25)} ${treatmentDisplay}${qtyString}`;
        content += `   ${line}\n`;
      });

      content += '\n__________________________________________________\n';
    });
  }

  content += '\n\n';
  content += 'Relatório gerado automaticamente pelo VisuLab\n';
  content += '==================================================\n';

  const fileName = `relatorio_${format(now, 'yyyyMMdd_HHmm')}.txt`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, fileName);
};
