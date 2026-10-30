import { Input } from "@/components/ui/input"

export function ScoreInput({
  value,
  onValueChange,
  max,
  step = 0.1,
  placeholder,
}: {
  value: string
  onValueChange: (v: string) => void
  max: number
  step?: number
  placeholder?: string
}) {
  const valid =
    value !== "" &&
    !Number.isNaN(Number(value)) &&
    Number(value) >= 0 &&
    Number(value) <= max

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          type="number"
          min={0}
          max={max}
          step={step}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className="pr-16"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          / {max}
        </span>
      </div>
      {value !== "" && !valid && (
        <p className="text-xs text-destructive">
          Enter a number between 0 and {max}.
        </p>
      )}
    </div>
  )
}

export default ScoreInput
