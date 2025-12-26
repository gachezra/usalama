"use client"

import { useEffect, useState } from "react"
import { Camera, CheckCircle, Banknote, AlertTriangle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface FeedItem {
  id: string
  type: "verification" | "payout" | "alert"
  message: string
  time: string
  icon: typeof Camera
}

const initialFeedItems: FeedItem[] = [
  { id: "1", type: "verification", message: "Citizen 882 Verified Project #291", time: "2 mins ago", icon: Camera },
  { id: "2", type: "payout", message: "Payout Sent (KES 50) to Citizen 882", time: "2 mins ago", icon: Banknote },
  { id: "3", type: "verification", message: "Citizen 1204 Verified Project #145", time: "5 mins ago", icon: Camera },
  { id: "4", type: "alert", message: "Risk Flag: Project #892 Labor Cost", time: "8 mins ago", icon: AlertTriangle },
  { id: "5", type: "payout", message: "Payout Sent (KES 50) to Citizen 1204", time: "5 mins ago", icon: Banknote },
  { id: "6", type: "verification", message: "Citizen 445 Verified Project #78", time: "12 mins ago", icon: Camera },
]

export function LiveFeed() {
  const [feedItems, setFeedItems] = useState(initialFeedItems)
  const [newItemId, setNewItemId] = useState<string | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      const newItem: FeedItem = {
        id: Date.now().toString(),
        type: Math.random() > 0.3 ? "verification" : Math.random() > 0.5 ? "payout" : "alert",
        message: `Citizen ${Math.floor(Math.random() * 2000)} ${Math.random() > 0.3 ? "Verified Project" : "Reported Issue"} #${Math.floor(Math.random() * 500)}`,
        time: "Just now",
        icon: Math.random() > 0.3 ? Camera : AlertTriangle,
      }

      setNewItemId(newItem.id)
      setFeedItems((prev) => [newItem, ...prev.slice(0, 5)])

      setTimeout(() => setNewItemId(null), 500)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="glass border-slate-700/50 h-[500px] flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-white flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
          </span>
          Real-Time Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="space-y-3 h-full overflow-y-auto pr-2">
          {feedItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 transition-all duration-300",
                newItemId === item.id && "animate-in slide-in-from-top-2 bg-cyan-500/10 border-cyan-500/30",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    item.type === "verification" && "bg-cyan-500/20 text-cyan-400",
                    item.type === "payout" && "bg-green-500/20 text-green-400",
                    item.type === "alert" && "bg-red-500/20 text-red-400",
                  )}
                >
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{item.message}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-500">{item.time}</span>
                  </div>
                </div>
                {item.type === "payout" && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
