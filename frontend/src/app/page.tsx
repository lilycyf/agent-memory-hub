import Link from "next/link";

const entryCards = [
  {
    kicker: "Browse frameworks",
    title: "Explore memory frameworks",
    description: "Filter memory systems by tags, language coverage, linked papers, and structured Q&A.",
    href: "/framework",
    cta: "Open frameworks",
  },
  {
    kicker: "Compare systems",
    title: "Inspect framework trade-offs",
    description: "Place multiple projects side by side and compare how they answer the same memory questions.",
    href: "/compare",
    cta: "Open compare",
  },
  {
    kicker: "Inspect Q&A",
    title: "Read the extracted Q&A",
    description: "Review the 38-question Q&A layer, repository metadata, and paper links behind each framework.",
    href: "/framework",
    cta: "View Q&A",
  },
] as const;

export default async function HomePage() {
  return (
    <div className="page-shell or-homepage">
      <section className="or-home-hero">
        <div className="or-home-hero-main">
          <p className="or-hero-kicker">Memory Router</p>
          <h1>Search the memory ecosystem like a live model directory.</h1>
          <p className="or-hero-subtitle or-home-subtitle">
            Browse repository-backed memory frameworks and scan the strongest signals quickly.
          </p>

          <div className="or-hero-actions">
            <Link href="/framework" className="btn btn-primary-or">
              Explore frameworks
            </Link>
            <Link href="/compare" className="btn secondary">
              Open compare
            </Link>
          </div>

        </div>
      </section>

      <section className="or-home-entry-grid" aria-label="Primary entry points">
        {entryCards.map((card) => (
          <article key={card.title} className="panel or-home-entry-card">
            <p className="section-kicker">{card.kicker}</p>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <Link href={card.href} className="link-action">
              {card.cta}
            </Link>
          </article>
        ))}
      </section>

    </div>
  );
}
