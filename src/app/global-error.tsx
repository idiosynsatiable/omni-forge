"use client";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html>
      <body>
        <div style={{ padding: "2rem", fontFamily: "ui-sans-serif, system-ui" }}>
          <h1>⚠️ Service Degraded</h1>
          <p>Omni-Forge is reachable but the runtime is in a degraded state.</p>
          <p>
            See <code>/api/health</code> for details.
          </p>
        </div>
      </body>
    </html>
  );
}
