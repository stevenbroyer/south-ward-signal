'use client';

import { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function AdminTable<T>({ columns, data, rowKey, onRowClick, emptyMessage = 'No data' }: AdminTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-sws-400 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sws-700/30">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-left px-5 py-2.5 text-xs font-mono text-sws-400 uppercase tracking-widest font-normal ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-sws-700/20 transition-colors hover:bg-bg-elevated/50 ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-5 py-3 ${col.className ?? ''}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
