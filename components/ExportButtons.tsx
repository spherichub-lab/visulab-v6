import React from 'react';
import { Icon } from './Icon';

interface ExportButtonsProps {
  onExportTxt?: () => void;
  onExportPdf?: () => void;
  onExportCsv?: () => void;
  isLoading: boolean;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ onExportTxt, onExportPdf, onExportCsv, isLoading }) => {
  return (
    <div className="flex items-center gap-2">
      {onExportCsv && (
        <button
          onClick={onExportCsv}
          disabled={isLoading}
          aria-label="Exportar para CSV"
          className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-slate-900 dark:bg-primary border border-transparent rounded-xl text-xs sm:text-sm font-bold text-white hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <Icon name="grid_on" className="!text-lg" />
          CSV
        </button>
      )}
      {onExportTxt && (
        <button
          onClick={onExportTxt}
          disabled={isLoading}
          aria-label="Exportar para TXT"
          className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-slate-900 dark:bg-primary border border-transparent rounded-xl text-xs sm:text-sm font-bold text-white hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <Icon name="description" className="!text-lg" />
          TXT
        </button>
      )}
      {onExportPdf && (
        <button
          onClick={onExportPdf}
          disabled={isLoading}
          aria-label="Exportar para PDF"
          className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-slate-900 dark:bg-primary border border-transparent rounded-xl text-xs sm:text-sm font-bold text-white hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <Icon name="picture_as_pdf" className="!text-lg" />
          PDF
        </button>
      )}
    </div>
  );
};