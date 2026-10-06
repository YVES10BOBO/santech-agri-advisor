import type { Metadata } from "next";
import FarmerDashboard from "@/components/FarmerDashboard";

export const metadata: Metadata = {
  title: "Umurima wanjye · Umujyanama w'Ubuhinzi",
};

export default function FarmerPage() {
  return <FarmerDashboard />;
}
