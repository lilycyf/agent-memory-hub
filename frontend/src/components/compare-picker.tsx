"use client";

import Link from "next/link";
import { useMemo } from "react";

type ComparePickerProps = {
  selectedIds: string[];
  onToggle: (entityId: string) => void;
};

export function ComparePicker({ selectedIds, onToggle }: ComparePickerProps) {
  const compareHref = useMemo(() => {
    const params = new URLSearchParams();
    selectedIds.forEach((id) => params.append("ids", id));
    return `/compare?${params.toString()}`;
  }, [selectedIds]);

  return (
    <div className="compare-shell">
      <div className="compare-title">Compare is ready</div>
      <div className="compare-count">{selectedIds.length} / 3 selected</div>
      <div className="chip-row">
        {selectedIds.map((id) => (
          <button key={id} type="button" className="chip removable" onClick={() => onToggle(id)}>
            {id} x
          </button>
        ))}
      </div>
      <div className="compare-actions">
        <Link className="btn primary" href={compareHref}>
          Compare
        </Link>
      </div>
    </div>
  );
}
