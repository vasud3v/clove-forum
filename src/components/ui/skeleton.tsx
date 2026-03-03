import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-2 border-border/30 bg-muted skeleton-stripe",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
