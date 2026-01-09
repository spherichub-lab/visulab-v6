/**
 * DataTableRow - Row component for DataTable
 * Handles row selection, clicking, and cell rendering
 */

import React from 'react';
import { Icon } from '../../../../components/Icon';
import { cn } from '../../../utils';
import { DataTableRowProps } from './types';
import { DataTableCell } from './DataTableCell';

/**
 * Row component for DataTable
 */
export const DataTableRow: React.FC<DataTableRowProps> = ({
    row,
    columns,
    selected = false,
    onSelect,
    actions,
    className,
    clickable = false,
    onClick,
    index,
    dataStatus,
}) => {
    const rowClasses = cn(
        'border-b border-slate-100 dark:border-slate-700 transition-colors',
        {
            'bg-slate-50 dark:bg-slate-800/50': selected,
            'hover:bg-slate-50 dark:hover:bg-slate-800/50': clickable,
            'cursor-pointer': clickable,
        },
        typeof className === 'function' ? className(row, index) : className
    );

    const handleRowClick = () => {
        if (clickable && onClick) {
            onClick();
        }
    };

    const handleSelectionChange = (checked: boolean) => {
        if (onSelect) {
            onSelect(checked);
        }
    };

    return (
        <tr
            className={rowClasses}
            onClick={handleRowClick}
            role="row"
            aria-selected={selected}
            data-testid="datatable-row"
            data-status={dataStatus}
        >
            {/* Selection checkbox */}
            {onSelect && (
                <td className="w-12 px-6 py-4">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => handleSelectionChange(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-700 dark:text-primary-500 dark:focus:ring-primary-400"
                        aria-label={`Select row ${index + 1}`}
                        data-testid="checkbox"
                    />
                </td>
            )}

            {/* Data cells */}
            {columns.map((column, colIndex) => (
                <DataTableCell
                    key={String(column.key)}
                    column={column}
                    row={row}
                    value={row[column.key]}
                    rowIndex={index}
                >
                    {row[column.key]}
                </DataTableCell>
            ))}

            {/* Actions cell */}
            {actions && (
                <td className="w-12 px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                        {actions}
                    </div>
                </td>
            )}
        </tr>
    );
};

DataTableRow.displayName = 'DataTableRow';

export default DataTableRow;