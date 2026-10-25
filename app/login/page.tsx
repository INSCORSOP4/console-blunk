import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/modules/auth/login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  // useSearchParams (para volver a la página pedida) exige un límite de Suspense.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
