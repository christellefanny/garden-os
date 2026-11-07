"use client";

import { LineIcon } from "@/components/ConservatoryUI";
import { growingCalendarSections, type Destination } from "@/lib/navigation";

export default function GrowingCalendarNavigation({ page, navigate }: {
  page: Destination;
  navigate: (page: Destination) => void;
}) {
  return (
    <nav className="growing-hub-navigation" aria-label="Growing Calendar sections">
      {growingCalendarSections.map(section => (
        <button
          key={section.page}
          type="button"
          aria-current={page === section.page ? "page" : undefined}
          onClick={() => navigate(section.page)}
        >
          <LineIcon name={section.page} />
          {section.label}
        </button>
      ))}
    </nav>
  );
}
