import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function PrimaryButton({ children, className, size = "lg", ...props }) {
  return (
    <Button
      className={cn(
        "w-full rounded-2xl bg-primary font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] min-h-touch",
        size === "lg" && "h-12 text-base min-h-[48px]",
        size === "default" && "h-10 text-sm min-h-[44px]",
        size === "sm" && "h-9 text-sm min-h-[40px]",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
