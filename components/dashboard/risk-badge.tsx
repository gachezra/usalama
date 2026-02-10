import { cn } from "@/lib/utils"
import type { RiskLevel } from "@/lib/types"

interface RiskBadgeProps {
  level: RiskLevel
  score?: number
  size?: "sm" | "md" | "lg"
}

const riskStyles: Record<RiskLevel, string> = {
  LOW: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  HIGH: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  CRITICAL: "bg-rose-500/20 text-rose-400 border-rose-500/30",
}

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
}

export function RiskBadge({ level, score, size = "md" }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded border",
        riskStyles[level],
        sizeStyles[size],
        level === "CRITICAL" && "animate-pulse"
      )}
    >
      {score !== undefined && <span className="font-mono">{score}</span>}
      <span>{level}</span>
    </span>
  )
}
