import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "הרשמה | MAVASH Events" };

export default function RegisterPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <AuthForm mode="register" redirectTo="/dashboard/new" />
    </Suspense>
  );
}
