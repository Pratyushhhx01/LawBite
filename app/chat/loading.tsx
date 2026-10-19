/**
 * Mirrors the shape of the chat shell (sidebar width, header, composer) so the
 * loading state doesn't jump or change background when ChatApp mounts.
 */
export default function ChatLoading() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-black text-white">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-black md:flex">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4">
          <div className="h-6 w-6 rounded-md bg-white/10" />
          <div className="h-4 w-16 rounded bg-white/10" />
        </div>
        <div className="space-y-2 px-4 pt-4">
          <div className="h-9 rounded-full bg-white/10" />
          <div className="h-9 rounded-full bg-white/10" />
        </div>
        <div className="mx-4 my-3 border-t border-white/10" />
        <div className="space-y-1 px-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-lg bg-white/[0.04]"
            />
          ))}
        </div>
        <div className="mt-auto border-t border-white/10 px-4 py-3">
          <div className="h-7 w-28 rounded-full bg-white/5" />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-8">
          <div className="space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
            <div className="h-2.5 w-24 rounded bg-white/5" />
          </div>
          <div className="h-8 w-8 rounded-full bg-white/5" />
        </div>

        <div className="flex-1" />

        <div className="border-t border-white/10 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
            <div className="h-9 w-9 rounded-full bg-white/5" />
            <div className="h-4 flex-1 animate-pulse rounded bg-white/5" />
            <div className="h-9 w-9 rounded-full bg-white/10" />
          </div>
        </div>
      </main>
    </div>
  );
}
