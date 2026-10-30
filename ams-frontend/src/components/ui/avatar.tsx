import { cn } from "@/lib/utils"
import { avatarColor } from "@/components/classroom/format"

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-xl",
} as const

export function Avatar({
  name,
  seed,
  size = "md",
  className,
}: {
  name?: string | null
  seed?: string
  size?: keyof typeof SIZES
  className?: string
}) {
  const label = name?.trim().charAt(0).toUpperCase() || "?"
  const colorSeed = seed || name || "?"
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        SIZES[size],
        avatarColor(colorSeed),
        className
      )}
    >
      {label}
    </div>
  )
}

export default Avatar
