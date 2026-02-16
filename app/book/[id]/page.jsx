"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ComensalGuard } from "@/components/auth/comensal-guard";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { timeSlots } from "@/lib/mock-data";
import { TimeSlotPicker } from "@/components/truebite/time-slot-picker";
import { PrimaryButton } from "@/components/truebite/primary-button";
import { RatingStars } from "@/components/truebite/rating-stars";
import {
  ArrowLeft,
  CalendarDays,
  Users,
  MessageSquare,
  CheckCircle2,
  Gift,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const bookingSchema = z.object({
  date: z.string().min(1, "Selecciona una fecha"),
  time: z.string().min(1, "Selecciona un horario"),
  guests: z.coerce.number().min(1, "Minimo 1 persona").max(12, "Maximo 12 personas"),
  notes: z.string().optional(),
});

export default function BookPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { getRestaurantById, addReservation, getActiveBenefitsForRestaurant } = useAppStore();
  const restaurant = getRestaurantById(id);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: { date: "", time: "", guests: 2, notes: "" },
  });

  const selectedTime = watch("time");
  const activeBenefits = getActiveBenefitsForRestaurant(id);
  const benefitToApply = activeBenefits[0]; // Usar el primer beneficio disponible

  if (!restaurant) {
    return (
      <ComensalGuard>
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-20">
        <p className="text-lg font-medium text-foreground">
          Restaurante no encontrado
        </p>
        <Link href="/" className="text-sm text-primary underline">
          Volver al inicio
        </Link>
      </div>
      </ComensalGuard>
    );
  }

  function onSubmit(data) {
    addReservation({
      restaurantId: id,
      date: data.date,
      time: data.time,
      guests: data.guests,
      notes: data.notes || "",
      ...(benefitToApply && { appliedBenefitId: benefitToApply.id }),
    });
    toast.success("Solicitud enviada", {
      description: benefitToApply
        ? `Tu reserva incluye el beneficio: ${benefitToApply.benefit}. Te avisaremos cuando la confirmen.`
        : `Hemos enviado tu solicitud a ${restaurant.name}. Te avisaremos cuando la confirmen.`,
      duration: 4000,
    });
    setSubmitted(true);
    // Redirigir automáticamente después de 2 segundos
    setTimeout(() => {
      router.push("/reservations");
    }, 2000);
  }

  if (submitted) {
    return (
      <ComensalGuard>
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground font-serif">
          ¡Solicitud enviada!
        </h2>
        <p className="text-sm text-muted-foreground">
          Tu solicitud de reserva en <span className="font-medium text-foreground">{restaurant.name}</span> ha sido enviada al restaurante.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          El restaurante revisará tu solicitud y te notificaremos cuando sea confirmada. Esto suele tomar unas horas.
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs mt-4">
          <PrimaryButton onClick={() => router.push("/reservations")}>
            Ver mis reservas
          </PrimaryButton>
          <PrimaryButton
            className="bg-secondary text-secondary-foreground shadow-none hover:bg-secondary/80"
            onClick={() => router.push("/")}
          >
            Seguir explorando
          </PrimaryButton>
        </div>
      </div>
      </ComensalGuard>
    );
  }

  return (
    <ComensalGuard>
    <div className="flex flex-col gap-6 px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/restaurants/${id}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border bg-card transition-transform hover:scale-105"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-foreground">Reservar mesa</h1>
          <p className="text-sm text-muted-foreground">{restaurant.name}</p>
        </div>
      </div>

      {/* Benefit banner */}
      {benefitToApply && (() => {
        const expiresAt = benefitToApply.expiresAt ? new Date(benefitToApply.expiresAt) : null;
        const now = new Date();
        const daysLeft = expiresAt
          ? Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)))
          : null;

        return (
          <div className="flex items-start gap-3 rounded-xl border-2 border-accent/30 bg-gradient-to-br from-accent/15 to-accent/5 px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20">
              <Gift className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-accent-foreground uppercase tracking-wide mb-0.5">
                Beneficio para esta reserva
              </p>
              <p className="text-sm font-medium text-foreground">
                {benefitToApply.benefit}
              </p>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                {daysLeft !== null && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {daysLeft === 0 ? "Vence hoy" : daysLeft === 1 ? "1 día restante" : `${daysLeft} días para usar`}
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground">
                  Se aplica al confirmar
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Restaurant mini card */}
      <div className="flex items-center gap-3 rounded-2xl border bg-card p-3">
        <img
          src={restaurant.image || "/placeholder.svg"}
          alt={restaurant.name}
          className="h-14 w-14 rounded-xl object-cover"
          crossOrigin="anonymous"
        />
        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-card-foreground text-sm">
            {restaurant.name}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <RatingStars rating={restaurant.rating} size="sm" />
            <span className="text-xs text-muted-foreground">
              {restaurant.rating}
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* Date */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarDays className="h-4 w-4 text-primary" />
            Fecha
          </label>
          <input
            type="date"
            {...register("date")}
            min={new Date().toISOString().split("T")[0]}
            className={cn(
              "h-11 w-full rounded-xl border bg-card px-3 text-sm text-card-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30",
              errors.date && "border-destructive"
            )}
          />
          {errors.date && (
            <p className="text-xs text-destructive">{errors.date.message}</p>
          )}
        </div>

        {/* Time */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Horario</label>
          <TimeSlotPicker
            slots={timeSlots}
            selected={selectedTime}
            onSelect={(time) => setValue("time", time, { shouldValidate: true })}
          />
          {errors.time && (
            <p className="text-xs text-destructive">{errors.time.message}</p>
          )}
        </div>

        {/* Guests */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Users className="h-4 w-4 text-primary" />
            Comensales
          </label>
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setValue("guests", num, { shouldValidate: true })}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-medium transition-all",
                  watch("guests") === num
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-card-foreground hover:border-primary/40"
                )}
              >
                {num}
              </button>
            ))}
            <input
              type="number"
              {...register("guests")}
              className="h-10 w-16 rounded-xl border bg-card px-2 text-center text-sm text-card-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              min={1}
              max={12}
            />
          </div>
          {errors.guests && (
            <p className="text-xs text-destructive">{errors.guests.message}</p>
          )}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MessageSquare className="h-4 w-4 text-primary" />
            Notas (opcional)
          </label>
          <textarea
            {...register("notes")}
            rows={3}
            placeholder="Alergias, ocasion especial, preferencias..."
            className="w-full rounded-xl border bg-card p-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
          />
        </div>

        <PrimaryButton type="submit">Confirmar reserva</PrimaryButton>
      </form>
    </div>
    </ComensalGuard>
  );
}
