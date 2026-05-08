"use client";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">⚠️ Service Degraded</h1>
      <p className="text-sm text-gray-400 mb-4">
        Omni-Forge is reachable but a backing service (most likely the database) is unavailable.
        The runtime healthcheck at <code className="text-cyan-400">/api/health</code> reports the
        full status. App pages will return once the database is reconnected.
      </p>
      {process.env.NODE_ENV !== "production" && error?.message && (
        <pre className="text-xs text-red-400 bg-black/30 p-3 rounded">{error.message}</pre>
      )}
    </div>
  );
}
