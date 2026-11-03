import type { Metadata } from "next";
import OwnerDashboard from "./owner-dashboard";

export const metadata: Metadata = {
  title: "Private dashboard · Garden Atelier",
  robots: { index: false, follow: false },
};

export default function OwnerPage() { return <OwnerDashboard />; }
