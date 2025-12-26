import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend: string
  trendUp?: boolean
  variant?: "default" | "warning" | "success"
}

export function StatsCard({ title, value, icon: Icon, trend, trendUp, variant = "default" }: StatsCardProps) {
  return (
    <Card className="glass border-slate-700/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">{title}</p>
            <p
              className={cn(
                "text-2xl font-bold font-mono",
                variant === "default" && "text-white",
                variant === "warning" && "text-yellow-400",
                variant === "success" && "text-green-400",
              )}
            >
              {value}
            </p>
            <div className="flex items-center gap-1 mt-2">
              {trendUp !== undefined &&
                (trendUp ? (
                  <TrendingUp className="w-3 h-3 text-green-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                ))}
              <span className="text-xs text-slate-400">{trend}</span>
            </div>
          </div>
          <div
            className={cn(
              "p-3 rounded-lg",
              variant === "default" && "bg-cyan-500/20 text-cyan-400",
              variant === "warning" && "bg-yellow-500/20 text-yellow-400",
              variant === "success" && "bg-green-500/20 text-green-400",
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
