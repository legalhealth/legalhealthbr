import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shimmer-gold rounded-2xl", className)} {...props} />;
}

export { Skeleton };
