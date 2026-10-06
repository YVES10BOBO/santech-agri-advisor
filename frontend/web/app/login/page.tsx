import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Injira · Umujyanama w'Ubuhinzi",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <LoginForm next={next} />;
}
