"use client";

import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useRef, useState, useSyncExternalStore } from "react";
import { BrandMark } from "@/components/layout/brand-mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { safeNext } from "@/lib/auth/session";
import { LoginShowcase } from "./login-showcase";

type Failure = { message: string; field?: "email" | "password" };

async function describeFailure(response: Response): Promise<Failure> {
  const body = (await response.json().catch(() => null)) as { detail?: string } | null;
  switch (response.status) {
    case 400:
      return { message: "Escribe tu correo y tu contraseña." };
    case 401:
      return { message: "Correo o contraseña incorrectos.", field: "password" };
    case 403:
      return { message: body?.detail ?? "Tu usuario no tiene acceso a esta consola." };
    case 429: {
      const seconds = Number(response.headers.get("retry-after"));
      const minutes = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds / 60) : null;
      return {
        message: `Demasiados intentos fallidos. Inténtalo de nuevo${minutes ? ` en ${minutes} min` : " más tarde"}.`,
      };
    }
    default:
      return {
        message: "No se pudo contactar al servicio de autenticación. Inténtalo en unos minutos.",
      };
  }
}

const subscribe = () => () => {};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const ids = { email: useId(), password: useId(), error: useId() };
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  // Antes de que la página termine de cargar el botón está deshabilitado: así Enter no envía el formulario
  // por el navegador (con la contraseña en la URL) cuando todavía no hay JavaScript.
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  async function onSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email || !password) {
      setFailure({
        message: "Escribe tu correo y tu contraseña.",
        field: email ? "password" : "email",
      });
      (email ? passwordRef : emailRef).current?.focus();
      return;
    }

    setLoading(true);
    setFailure(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const next = await describeFailure(response);
        setFailure(next);
        if (response.status === 401) {
          // Se conserva el correo y se limpia la contraseña para reintentar rápido.
          if (passwordRef.current) passwordRef.current.value = "";
          passwordRef.current?.focus();
        }
        return;
      }
      router.replace(safeNext(params.get("next")));
      router.refresh();
    } catch {
      setFailure({
        message: "No hay conexión con el servidor. Revisa tu red e inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-background grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12 sm:py-10 lg:px-16">
        <div className="flex items-center justify-between">
          <BrandMark />
          <ThemeToggle />
        </div>

        <div className="rise mx-auto w-full max-w-sm">
          <p className="eyebrow mb-2">Acceso del equipo</p>
          <h1 id="login-title" className="text-4xl font-semibold tracking-tight">
            Iniciar sesión
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Usa el correo y la contraseña de tu cuenta de Prosur.
          </p>

          <form
            onSubmit={onSubmit}
            method="post"
            action="/api/auth/login"
            noValidate
            className="mt-8 space-y-5"
            aria-labelledby="login-title"
          >
            <div className="space-y-1.5">
              <label htmlFor={ids.email} className="text-sm font-medium">
                Correo electrónico
              </label>
              <Input
                ref={emailRef}
                id={ids.email}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoFocus
                required
                maxLength={100}
                placeholder="nombre@prosur.com.mx"
                className="h-11"
                aria-invalid={failure?.field === "email" || undefined}
                aria-describedby={failure ? ids.error : undefined}
                readOnly={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor={ids.password} className="text-sm font-medium">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  ref={passwordRef}
                  id={ids.password}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  maxLength={200}
                  className="h-11 pr-11"
                  aria-invalid={failure?.field === "password" || undefined}
                  aria-describedby={failure ? ids.error : undefined}
                  readOnly={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                  className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 grid w-11 place-items-center rounded-md"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div aria-live="assertive" id={ids.error}>
              {failure && (
                <p
                  role="alert"
                  className="bg-danger-soft text-danger border-danger/30 flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {failure.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="group h-11 w-full rounded-full"
              disabled={loading || !hydrated}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden /> Verificando…
                </>
              ) : (
                <>
                  Entrar{" "}
                  <ArrowRight
                    className="transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-muted-foreground text-center font-mono text-xs lg:text-left">
          Soporte Software · acceso restringido
        </p>
      </div>

      <LoginShowcase />
    </main>
  );
}
