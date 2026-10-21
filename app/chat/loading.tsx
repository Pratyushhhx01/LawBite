/**
 * Mirrors the shape of the chat shell (header, composer) so the loading state
 * doesn't jump or change background when ChatApp mounts. The sidebar is a
 * hover drawer, so it is not part of the default layout.
 */
export default function ChatLoading() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-black text-white">
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/5" />
            <div className="space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
              <div className="h-2.5 w-24 rounded bg-white/5" />
            </div>
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
