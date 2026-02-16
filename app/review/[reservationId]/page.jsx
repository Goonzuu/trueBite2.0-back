"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ComensalGuard } from "@/components/auth/comensal-guard";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { RatingStars } from "@/components/truebite/rating-stars";
import { TagPill } from "@/components/truebite/tag-pill";
import { PrimaryButton } from "@/components/truebite/primary-button";
import { VerifiedBadge } from "@/components/truebite/verified-badge";
import {
  ArrowLeft,
  CheckCircle2,
  UtensilsCrossed,
  ConciergeBell,
  Lamp,
  Coins,
  ImagePlus,
  X,
  ShieldCheck,
  ShieldX,
} from "lucide-react";

const QUICK_TAGS = [
  "Volveria",
  "Buen servicio",
  "Demora",
  "Porciones grandes",
  "Romantico",
  "Buena relacion calidad-precio",
  "Ruidoso",
  "Ideal para grupos",
];

const MOCK_PHOTO_URLS = [
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=300&fit=crop",
];

const reviewSchema = z.object({
  rating: z.number().min(1, "Selecciona una puntuacion general"),
  comment: z.string().min(10, "Escribe al menos 10 caracteres"),
  food: z.number().min(1, "Puntua la comida"),
  service: z.number().min(1, "Puntua el servicio"),
  ambiance: z.number().min(1, "Puntua el ambiente"),
  value: z.number().min(1, "Puntua la relacion calidad-precio"),
});

const categoryConfig = [
  { key: "food", label: "Sabor", icon: UtensilsCrossed },
  { key: "service", label: "Servicio", icon: ConciergeBell },
  { key: "ambiance", label: "Ambiente", icon: Lamp },
  { key: "value", label: "Precio-calidad", icon: Coins },
];

export default function ReviewPage({ params }) {
  const { reservationId } = use(params);
  const router = useRouter();
  const { getReservationById, getRestaurantById, addReview, user } =
    useAppStore();
  const [submitted, setSubmitted] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [photos, setPhotos] = useState([]);

  const reservation = getReservationById(reservationId);
  const restaurant = reservation
    ? getRestaurantById(reservation.restaurantId)
    : null;

  const {
    control,
    handleSubmit,
    formState: { errors },
    register,
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
      food: 0,
      service: 0,
      ambiance: 0,
      value: 0,
    },
  });

  // Guard: reservation not found
  if (!reservation || !restaurant) {
    return (
      <ComensalGuard>
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-20">
        <p className="text-lg font-medium text-foreground">
          Reserva no encontrada
        </p>
        <Link href="/reservations" className="text-sm text-primary underline">
          Volver a reservas
        </Link>
      </div>
      </ComensalGuard>
    );
  }

  // Guard: only COMPLETED reservations can be reviewed
  if (reservation.status !== "COMPLETED") {
    return (
      <ComensalGuard>
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
          <ShieldX className="h-7 w-7 text-destructive" />
        </div>
        <p className="text-lg font-semibold text-foreground">
          Aún no puedes dejar review
        </p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Las reviews verificadas solo están disponibles para reservas que ya se completaron. 
          El estado actual de esta reserva es{" "}
          <span className="font-medium text-foreground">
            {reservation.status === "PENDING_CONFIRMATION" 
              ? "pendiente de confirmación"
              : reservation.status === "CONFIRMED"
              ? "confirmada"
              : reservation.status.replace(/_/g, " ").toLowerCase()}
          </span>
          .
        </p>
        <p className="max-w-xs text-xs text-muted-foreground mt-2">
          Una vez que completes tu visita, podrás dejar una review verificada que genere confianza.
        </p>
        <Link href="/reservations" className="text-sm text-primary underline">
          Volver a reservas
        </Link>
      </div>
      </ComensalGuard>
    );
  }

  // Guard: already reviewed
  if (reservation.reviewed) {
    return (
      <ComensalGuard>
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <CheckCircle2 className="h-12 w-12 text-primary" />
        <p className="text-lg font-medium text-foreground">
          Ya dejaste una review para esta reserva
        </p>
        <Link
          href={`/restaurants/${restaurant.id}`}
          className="text-sm text-primary underline"
        >
          Ver restaurante
        </Link>
      </div>
      </ComensalGuard>
    );
  }

  function toggleTag(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function addMockPhoto() {
    if (photos.length >= 3) return;
    const available = MOCK_PHOTO_URLS.filter((u) => !photos.includes(u));
    if (available.length > 0) {
      setPhotos((prev) => [...prev, available[0]]);
    }
  }

  function removePhoto(url) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  function onSubmit(data) {
    addReview({
      reservationId,
      restaurantId: reservation.restaurantId,
      userId: user.id,
      userName: user.name,
      rating: data.rating,
      comment: data.comment,
      categories: {
        food: data.food,
        service: data.service,
        ambiance: data.ambiance,
        value: data.value,
      },
      tags: selectedTags,
      photos,
    });
    const hasBenefit = restaurant?.benefit?.trim();
    toast.success("¡Review verificada publicada!", {
      description: hasBenefit
        ? `${restaurant.name} te regaló: ${restaurant.benefit}. Lo verás en tu perfil.`
        : "Tu opinión ayuda a otros comensales a tomar decisiones confiables.",
      duration: 5000,
    });
    setSubmitted(true);
    // Redirigir automáticamente después de 2 segundos
    setTimeout(() => {
      router.push(`/restaurants/${restaurant.id}`);
    }, 2000);
  }

  // Success screen
  if (submitted) {
    return (
      <ComensalGuard>
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground font-serif">
          ¡Gracias por tu opinión!
        </h2>
        <VerifiedBadge size="lg" />
        <p className="text-sm text-muted-foreground max-w-sm">
          Tu review verificada ha sido publicada. Al venir de una reserva real, 
          tu opinión genera confianza y ayuda a otros comensales a elegir mejor.
        </p>
        {restaurant?.benefit?.trim() && (
          <p className="text-sm font-medium text-accent-foreground max-w-sm">
            ¡{restaurant.name} te regaló: {restaurant.benefit}! Lo verás en tu perfil. Válido 30 días.
          </p>
        )}
        <div className="flex flex-col gap-2 w-full max-w-xs mt-4">
          <PrimaryButton
            onClick={() => router.push(`/restaurants/${restaurant.id}`)}
          >
            Ver {restaurant.name}
          </PrimaryButton>
          <PrimaryButton
            className="bg-secondary text-secondary-foreground shadow-none hover:bg-secondary/80"
            onClick={() => router.push("/reservations")}
          >
            Volver a reservas
          </PrimaryButton>
        </div>
      </div>
      </ComensalGuard>
    );
  }

  return (
    <ComensalGuard>
    <div className="flex flex-col gap-6 px-4 py-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/reservations"
          className="flex h-9 w-9 items-center justify-center rounded-full border bg-card transition-transform hover:scale-105"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-foreground">Dejar review</h1>
          <p className="text-sm text-muted-foreground">{restaurant.name}</p>
        </div>
      </div>

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
          <p className="text-xs text-muted-foreground">
            {reservation.date} &middot; {reservation.time} &middot;{" "}
            {reservation.guests}{" "}
            {reservation.guests === 1 ? "persona" : "personas"}
          </p>
        </div>
      </div>

      {/* Verified notice */}
      <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-medium text-foreground mb-0.5">
            Esta es una review verificada
          </p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Tu reserva completada en este restaurante valida que realmente asististe. 
            Tu opinión ayudará a otros comensales a tomar decisiones confiables.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Overall rating */}
        <div className="flex flex-col items-center gap-2 rounded-2xl border bg-card p-6">
          <p className="text-sm font-medium text-card-foreground">
            Puntuacion general
          </p>
          <Controller
            name="rating"
            control={control}
            render={({ field }) => (
              <RatingStars
                rating={field.value}
                size="xl"
                interactive
                onChange={field.onChange}
              />
            )}
          />
          {errors.rating && (
            <p className="text-xs text-destructive">{errors.rating.message}</p>
          )}
        </div>

        {/* Category ratings */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">
            Puntua cada aspecto
          </p>
          <div className="grid grid-cols-2 gap-3">
            {categoryConfig.map(({ key, label, icon: Icon }) => (
              <div
                key={key}
                className="flex flex-col items-center gap-2 rounded-xl border bg-card p-3"
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium text-card-foreground">
                    {label}
                  </span>
                </div>
                <Controller
                  name={key}
                  control={control}
                  render={({ field }) => (
                    <RatingStars
                      rating={field.value}
                      size="sm"
                      interactive
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors[key] && (
                  <p className="text-xs text-destructive">
                    {errors[key].message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick tags */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">
            Etiquetas rapidas
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_TAGS.map((tag) => (
              <TagPill
                key={tag}
                active={selectedTags.includes(tag)}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </TagPill>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">
            Tu experiencia
          </label>
          <textarea
            {...register("comment")}
            rows={4}
            placeholder="Cuentanos tu experiencia: la comida, el servicio, el ambiente..."
            className="w-full rounded-xl border bg-card p-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
          />
          {errors.comment && (
            <p className="text-xs text-destructive">
              {errors.comment.message}
            </p>
          )}
        </div>

        {/* Photo upload (mock) */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">
            Fotos{" "}
            <span className="font-normal text-muted-foreground">
              (opcional, max 3)
            </span>
          </p>
          <div className="flex gap-3">
            {photos.map((url) => (
              <div key={url} className="relative">
                <img
                  src={url || "/placeholder.svg"}
                  alt="Foto de la visita"
                  className="h-20 w-20 rounded-xl object-cover"
                  crossOrigin="anonymous"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                  aria-label="Eliminar foto"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {photos.length < 3 && (
              <button
                type="button"
                onClick={addMockPhoto}
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-[10px] font-medium">Subir</span>
              </button>
            )}
          </div>
        </div>

        <PrimaryButton type="submit">Publicar review verificada</PrimaryButton>
      </form>
    </div>
    </ComensalGuard>
  );
}
