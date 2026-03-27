import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell narrow">
      <h1 className="page-title">Page not found</h1>
      <p className="browse-description">The page you requested does not exist.</p>
      <Link className="btn btn-secondary" href="/">
        Go home
      </Link>
    </div>
  );
}
