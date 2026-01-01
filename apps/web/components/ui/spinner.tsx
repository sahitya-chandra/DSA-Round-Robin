import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

export function Spinner({ size = "md", className, text }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2
        className={cn(
          "animate-spin text-primary",
          sizeClasses[size],
          className
        )}
      />
      {text && (
        <p className="font-minecraft text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

// Full page loading spinner
export function PageSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin pixel-border-outset" />
        <p className="font-minecraft animate-pulse text-primary">{text}</p>
      </div>
    </div>
  );
}

// Inline spinner for buttons and small areas
export function InlineSpinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("animate-spin text-current", className || "w-4 h-4")}
    />
  );
}
