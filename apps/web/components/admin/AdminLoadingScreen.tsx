export function AdminLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-sws-700 border-t-red rounded-full animate-spin" />
        <span className="text-xs font-mono text-sws-400">Loading…</span>
      </div>
    </div>
  );
}
