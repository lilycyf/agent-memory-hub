import Link from "next/link";
import { ExternalLink } from "@/components/external-link";

type LinkItem = { href: string; label: string; external?: boolean };

type Group = { title: string; links: LinkItem[] };

const GROUPS: Group[] = [
  {
    title: "Product",
    links: [
      { href: "/", label: "Home" },
      { href: "/framework", label: "Frameworks" },
      { href: "/compare", label: "Compare" },
    ],
  },
  {
    title: "Company",
    links: [{ href: "/", label: "About" }],
  },
  {
    title: "Developer",
    links: [
      { href: "https://github.com", label: "GitHub", external: true },
      { href: "https://arxiv.org", label: "arXiv", external: true },
    ],
  },
  {
    title: "Connect",
    links: [
      { href: "/compare", label: "Compare workspace" },
      { href: "https://github.com", label: "GitHub", external: true },
    ],
  },
];

function renderLink(item: LinkItem) {
  if (item.external) {
    return (
      <ExternalLink key={item.label} href={item.href}>
        {item.label}
      </ExternalLink>
    );
  }
  return (
    <Link key={item.label} href={item.href}>
      {item.label}
    </Link>
  );
}

export function AppFooter() {
  const visible = GROUPS.filter((g) => g.links.length > 0);

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <span className="footer-mark">MR</span>
          <div>
            <strong>Memory Router</strong>
            <p>Memory framework discovery and compare workflows.</p>
          </div>
        </div>

        <div className="site-footer-grid site-footer-grid-or">
          {visible.map((group) => (
            <section key={group.title} className="site-footer-group">
              <h2>{group.title}</h2>
              <div className="site-footer-links">{group.links.map(renderLink)}</div>
            </section>
          ))}
        </div>
      </div>
    </footer>
  );
}
