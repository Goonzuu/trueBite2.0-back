"use client";

import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

export function TimeSlotPicker({ slots = [], selected, onSelect, className }) {
  const afternoon = slots.filter((s) => {
    const hour = parseInt(s.split(":")[0], 10);
    return hour < 18;
  });
  const evening = slots.filter((s) => {
    const hour = parseInt(s.split(":")[0], 10);
    return hour >= 18;
  });

  function renderGroup(label, items) {
    if (items.length === 0) return null;
    return (
      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Clock className="h-3 w-3" />
          {label}
        </span>
        <div className="flex flex-wrap gap-2">
          {items.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => onSelect?.(slot)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition-all",
                selected === slot
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-card-foreground hover:border-primary/40 hover:bg-primary/5"
              )}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {renderGroup("Mediodia", afternoon)}
      {renderGroup("Noche", evening)}
    </div>
  );
}
