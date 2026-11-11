export function RouteLoading({ title = 'Loading' }: { title?: string }) {
  return (
    <div role="status" aria-live="polite" data-static className="grid min-h-[52vh] place-items-center px-6 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="loader-ring" aria-hidden="true" />
        <p className="font-serif text-3xl text-navy-900">{title}</p>
        <p className="text-sm text-muted">Preparing this page</p>
      </div>
    </div>
  );
}
