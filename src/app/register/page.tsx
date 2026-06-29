import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "הרשמה | MAVASH Events" };

export default function RegisterPage() {
  return <AuthForm mode="register" redirectTo="/dashboard/new" />;
}
