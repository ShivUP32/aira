import Link from "next/link";

export default function NotFound() {
  return (
    <main className="site-shell" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <section className="paper-card" style={{ maxWidth: 520, padding: "2rem", textAlign: "center" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>Page not found</h1>
        <p style={{ marginBottom: "1.25rem" }}>
          The page you tried to open doesn&apos;t exist or may have moved.
        </p>
        <Link href="/" className="primary-button">Go to home</Link>
      </section>
    </main>
  );
}
