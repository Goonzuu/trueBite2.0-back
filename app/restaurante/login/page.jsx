"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { PrimaryButton } from "@/components/truebite/primary-button";
import { UtensilsCrossed, Lock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { loginRestaurante, isRestauranteLoggedIn } from "@/lib/auth";
import { useAppStore } from "@/lib/store";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
  restaurantId: z.string().min(1, "Selecciona tu restaurante"),
});

export default function RestauranteLoginPage() {
  const router = useRouter();
  const { restaurants } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "restaurante@truebite.com",
      password: "demo",
      restaurantId: restaurants[0]?.id || "",
    },
  });

  const selectedRestaurantId = watch("restaurantId");

  useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurantId) {
      setValue("restaurantId", restaurants[0].id);
    }
  }, [restaurants, selectedRestaurantId, setValue]);

  useEffect(() => {
    if (isRestauranteLoggedIn()) {
      router.replace("/restaurante");
    }
  }, [router]);

  function onSubmit(data) {
    setIsLoading(true);
    setTimeout(() => {
      loginRestaurante(data.email, data.restaurantId);
      toast.success("Bienvenido al panel", {
        description: "Gestiona tus reservas, reviews y beneficios.",
      });
      router.push("/restaurante");
    }, 400);
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <UtensilsCrossed className="h-7 w-7 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground font-serif">
              Panel Restaurante
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gestiona reservas, reviews y configura beneficios
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
              placeholder="restaurante@truebite.com"
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
              <UtensilsCrossed className="h-4 w-4 text-primary" />
              ¿Qué restaurante gestionas?
            </label>
            <select
              {...register("restaurantId")}
              className={cn(
                "h-11 w-full rounded-xl border bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30",
                errors.restaurantId && "border-destructive"
              )}
            >
              <option value="">Seleccionar restaurante</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.city}
                </option>
              ))}
            </select>
            {errors.restaurantId && (
              <p className="text-xs text-destructive">{errors.restaurantId.message}</p>
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
              <span className="font-medium text-foreground">Demo:</span> Cualquier
              email y contraseña funcionan.
            </p>
          </div>

          <PrimaryButton type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Entrando..." : "Entrar al panel"}
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Eres comensal?{" "}
          <Link href="/" className="font-medium text-primary hover:underline">
            Explorar restaurantes
          </Link>
        </p>
      </div>
    </div>
  );
}
