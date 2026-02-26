interface AdminStatCardProps {
  label: string;
  value: string | number;
  detail?: string;
}

export function AdminStatCard({ label, value, detail }: AdminStatCardProps) {
  return (
    <div className="bg-bg-card border border-sws-700/50 rounded-lg p-5">
      <p className="text-xs font-mono text-sws-400 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-bold text-sws-white mt-1">{value}</p>
      {detail && <p className="text-xs text-sws-400 mt-1">{detail}</p>}
    </div>
  );
}
