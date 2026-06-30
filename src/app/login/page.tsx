import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "התחברות | MAVASH Events" };

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
