import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="page-shell narrow">
      <h1 className="page-title">Sign up</h1>
      <p className="browse-description">Account registration is coming soon.</p>
      <Link className="link-action" href="/">
        Back to home
      </Link>
    </div>
  );
}
