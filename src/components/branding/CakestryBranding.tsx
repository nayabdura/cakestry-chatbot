import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRANDING, brandName, brandUrl } from "@/lib/branding";

/**
 * Brand attribution component for Cakestry Bakery.
 */
export function CakestryBranding({
  className,
  variant = "line",
}: {
  className?: string;
  variant?: "line" | "stacked";
}) {
  if (variant === "stacked") {
    return (
      <div className={cn("flex flex-col items-center gap-1 text-center", className)}>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-accent" aria-hidden />
          {BRANDING.product.poweredBy}
        </span>
        <span className="text-xs text-muted-foreground">
          <Link
            href={brandUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground hover:text-primary"
          >
            {brandName}
          </Link>
        </span>
      </div>
    );
  }

  return (
    <p
      className={cn(
        "inline-flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground",
        className
      )}
    >
      <Sparkles className="size-3.5 text-accent" aria-hidden />
      <span>Designed &amp; Developed for</span>
      <Link
        href={brandUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-foreground transition-colors hover:text-primary"
      >
        {brandName}
      </Link>
    </p>
  );
}
