function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl ${className ?? ""}`} style={{ background: "var(--sub)" }} />;
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Pulse className="h-7 w-40" />
        <Pulse className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Pulse key={i} className="h-32" />
        ))}
      </div>
      <Pulse className="h-72" />
      <Pulse className="h-72" />
    </div>
  );
}
