export default function LegalLoading() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-white/5" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-white/5"
              style={{ width: `${85 - i * 10}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
