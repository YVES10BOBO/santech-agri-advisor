import type { Metadata } from "next";
import InsightsDashboard from "@/components/InsightsDashboard";

export const metadata: Metadata = {
  title: "Insights · Umujyanama w'Ubuhinzi",
};

export default function InsightsPage() {
  return <InsightsDashboard />;
}
