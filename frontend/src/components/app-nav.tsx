"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteSearchCommand } from "@/components/site-search-command";

const LINKS = [
  { href: "/framework", label: "Frameworks" },
  { href: "/compare", label: "Compare" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-brand">
          <span className="site-brand-mark" aria-hidden="true">AMH</span>
          <span className="site-brand-text">Agent Memory Hub</span>
        </Link>
        <SiteSearchCommand />
        <div className="site-nav-wrap">
          <nav className="site-nav" aria-label="Primary">
            <Link href="/" className={`site-nav-link ${pathname === "/" ? "active" : ""}`}>Home</Link>
            {LINKS.map((link) => {
              const active =
                pathname === link.href || (link.href !== "/" && pathname?.startsWith(`${link.href}/`));
              return (
                <Link key={link.href} href={link.href} className={`site-nav-link ${active ? "active" : ""}`}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <Link href="/signup" className="btn btn-signup">Sign Up</Link>
        </div>
      </div>
    </header>
  );
}
