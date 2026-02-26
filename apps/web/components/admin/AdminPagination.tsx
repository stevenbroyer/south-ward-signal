'use client';

interface AdminPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({ page, pageSize, total, onPageChange }: AdminPaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.ceil(total / pageSize);

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-sws-700/30">
      <span className="text-xs text-sws-400 font-mono">
        Showing {start}–{end} of {total}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 text-xs font-mono rounded border border-sws-700/50 text-sws-300
            hover:bg-bg-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Prev
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 text-xs font-mono rounded border border-sws-700/50 text-sws-300
            hover:bg-bg-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
