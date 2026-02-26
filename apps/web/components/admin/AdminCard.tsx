import { ReactNode } from 'react';

interface AdminCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export function AdminCard({ children, className = '', title, action }: AdminCardProps) {
  return (
    <div className={`bg-bg-card border border-sws-700/50 rounded-xl ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-sws-700/30">
          <h3 className="font-display font-bold text-sm text-sws-white">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
