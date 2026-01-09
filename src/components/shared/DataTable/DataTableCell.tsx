/**
 * DataTableCell - Individual cell component for DataTable
 * Handles cell rendering with custom content and alignment
 */

import React from 'react';
import { cn } from '../../../utils';
import { DataTableCellProps } from './types';

/**
 * Individual cell component for DataTable
 */
export const DataTableCell: React.FC<DataTableCellProps> = ({
    children,
    column,
    row,
    value,
    rowIndex,
    className,
}) => {
    const cellClasses = cn(
        'px-6 py-4 whitespace-nowrap text-sm',
        {
            'text-left': column.align === 'left' || !column.align,
            'text-center': column.align === 'center',
            'text-right': column.align === 'right',
        },
        column.className,
        className
    );

    const renderContent = () => {
        if (column.render) {
            return column.render(value, row, rowIndex);
        }
        return children;
    };

    return (
        <td className={cellClasses} role="gridcell">
            {renderContent()}
        </td>
    );
};

DataTableCell.displayName = 'DataTableCell';

export default DataTableCell;