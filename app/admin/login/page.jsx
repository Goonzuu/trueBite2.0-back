"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PrimaryButton } from "@/components/truebite/primary-button";
import { Shield, Lock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(data) {
    setIsLoading(true);
    
    // Mock login - acepta cualquier email/password
    setTimeout(() => {
      // Guardar sesión admin en localStorage
      localStorage.setItem("truebite_admin", JSON.stringify({
        email: data.email,
        loggedIn: true,
        timestamp: Date.now(),
      }));
      
      toast.success("Sesión iniciada", {
        description: "Bienvenido al panel de administración",
      });
      
      router.push("/admin");
    }, 500);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground font-serif">
              Admin TrueBite
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acceso al panel de administración
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm"
        >
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Mail className="h-4 w-4 text-primary" />
              Email
            </label>
            <input
              type="email"
              {...register("email")}
              placeholder="admin@truebite.com"
              className={cn(
                "h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30",
                errors.email && "border-destructive"
              )}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Lock className="h-4 w-4 text-primary" />
              Contraseña
            </label>
            <input
              type="password"
              {...register("password")}
              placeholder="••••••••"
              className={cn(
                "h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30",
                errors.password && "border-destructive"
              )}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Modo mock:</span>{" "}
              Cualquier email y contraseña funcionan para acceder.
            </p>
          </div>

          <PrimaryButton type="submit" disabled={isLoading}>
            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}
