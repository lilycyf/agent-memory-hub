import { Suspense } from "react";
import { ComparePageClient } from "@/components/compare-page-client";

export default function ComparePage() {
  return (
    <div className="page-shell">
      <Suspense fallback={<p className="hint">Loading compare...</p>}>
        <ComparePageClient />
      </Suspense>
    </div>
  );
}
