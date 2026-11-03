"use client";

import { Analytics } from "@vercel/analytics/next";

export default function TrafficAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = new URL(event.url);
        if (url.pathname === "/owner" || url.pathname.startsWith("/owner/")) return null;
        // Keep account links and garden details out of traffic reports.
        url.search = "";
        url.hash = "";
        return { ...event, url: url.toString() };
      }}
    />
  );
}
