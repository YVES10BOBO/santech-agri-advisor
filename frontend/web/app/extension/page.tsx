import type { Metadata } from "next";
import ExtensionDashboard from "@/components/ExtensionDashboard";

export const metadata: Metadata = {
  title: "Abajyanama b'ubuhinzi · Umujyanama w'Ubuhinzi",
};

export default function ExtensionPage() {
  return <ExtensionDashboard />;
}
