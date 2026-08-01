export default function LandingPage() {
  const year = new Date().getFullYear();

  return (
    <main className="landing">
      <section className="landing__card">
        <span className="landing__badge">În construcție</span>
        <div className="landing__trophy">🏆</div>
        <h1 className="landing__title">
          suntcastigator<span className="landing__title-dot">.ro</span>
        </h1>
        <p className="landing__tagline">
          Lucrăm la ceva grozav. Revenim în curând!
        </p>

        <div className="landing__names">
          <span className="landing__name">A</span>
          <span className="landing__name">C</span>
          <span className="landing__name">L</span>
        </div>

        <p className="landing__footer">
          © {year} <strong>suntcastigator.ro</strong> — Toate drepturile
          rezervate.
        </p>
      </section>
    </main>
  );
}
