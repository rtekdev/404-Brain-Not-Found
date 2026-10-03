export default function Loading() {
  return (
    <main className="flex flex-1 flex-col px-4 py-6" aria-busy="true">
      <div className="mx-auto w-full max-w-3xl animate-pulse space-y-4">
        <div className="h-8 w-40 rounded-lg bg-panel-hover" />
        <div className="h-96 rounded-xl border border-line bg-panel-solid" />
      </div>
    </main>
  );
}
