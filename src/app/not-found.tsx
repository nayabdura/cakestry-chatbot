/**
 * App Router 404.
 *
 * Defining this explicitly matters beyond aesthetics: without it, `next build`
 * can fall back to the pages-router error document while prerendering /404,
 * which fails the build with "<Html> should not be imported outside of
 * pages/_document" — an error that names an import this project does not have,
 * and hides whatever actually crashed.
 *
 * It is deliberately **import-free**, for the same reason `global-error.tsx`
 * is. This is one of only two pages Next prerenders before anything else, and
 * it runs in a build worker with no environment and no browser. Anything it
 * pulls in — a component library, an icon set, a module that reads config —
 * becomes a way for the build to die at page 0 of 12 with that misleading
 * message. A 404 page is not worth that risk, so it renders plain markup with
 * inline styles and no dependencies at all.
 *
 * The gradient is hard-coded rather than read from the brand registry for the
 * same reason. Keep it that way.
 */
export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "1.5rem",
        background: "linear-gradient(160deg, #0b1d5b, #123a8a 55%, #0f766e)",
        color: "white",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ width: "100%", maxWidth: "28rem", textAlign: "center" }}>
        <p style={{ fontSize: "3.75rem", fontWeight: 700, margin: 0, lineHeight: 1 }}>
          404
        </p>
        <h1 style={{ marginTop: "0.75rem", fontSize: "1.25rem", fontWeight: 600 }}>
          This page doesn&apos;t exist
        </h1>
        <p
          style={{
            marginTop: "0.5rem",
            fontSize: "0.875rem",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.75)",
          }}
        >
          The link may be out of date. The assistant is still here and happy to help
          with Cakestry Bakery cake orders and special events.
        </p>

        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            justifyContent: "center",
          }}
        >
          <a
            href="/chat"
            style={{
              padding: "0.625rem 1.25rem",
              borderRadius: "9999px",
              background: "white",
              color: "#0b1d5b",
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Open the assistant
          </a>
          <a
            href="/"
            style={{
              padding: "0.625rem 1.25rem",
              borderRadius: "9999px",
              border: "1px solid rgba(255,255,255,0.3)",
              background: "rgba(255,255,255,0.05)",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Home
          </a>
        </div>

        <p style={{ marginTop: "2.5rem", fontSize: "0.6875rem", color: "rgba(255,255,255,0.5)" }}>
          Cakestry AI Assistant
        </p>
      </div>
    </main>
  );
}
