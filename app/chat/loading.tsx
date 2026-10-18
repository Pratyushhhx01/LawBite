export default function ChatLoading() {
  return (
    <div className="flex h-screen w-full bg-black">
      <div className="hidden w-72 shrink-0 border-r border-white/10 bg-[#0a0a0a] p-4 md:block">
        <div className="mb-4 h-8 w-32 animate-pulse rounded bg-white/5" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex h-14 items-center border-b border-white/10 px-4">
          <div className="h-5 w-40 animate-pulse rounded bg-white/5" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-sm text-white/40">Loading chat…</p>
          </div>
        </div>
      </div>
    </div>
  );
}
