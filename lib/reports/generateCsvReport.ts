import saveAs from 'file-saver';
import { format } from 'date-fns';

export const generateCsvReport = (data: any[], filenamePrefix: string) => {
    if (!data || data.length === 0) {
        alert("Nenhum dado para exportar.");
        return;
    }

    // Extract headers
    const headers = Object.keys(data[0]).join(',');
    
    // Map rows
    const rows = data.map(obj => {
        return Object.values(obj).map(val => {
            // Escape quotes and wrap in quotes if string contains comma
            const stringVal = String(val);
            if (stringVal.includes(',')) {
                return `"${stringVal}"`;
            }
            return stringVal;
        }).join(',');
    }).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `${filenamePrefix}_${format(new Date(), 'yyyyMMdd')}.csv`;
    
    saveAs(blob, fileName);
};