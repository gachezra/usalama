"use client"

import { useState } from "react"
import { Camera, Send, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import type { ClarificationRequest } from "@/lib/types"
import { toast } from "sonner"

interface VerificationCardProps {
  request: ClarificationRequest
  index: number
}

type DispatchState = "idle" | "sending" | "sent"

export function VerificationCard({ request, index }: VerificationCardProps) {
  const [dispatchState, setDispatchState] = useState<DispatchState>("idle")

  const handleDispatch = async () => {
    setDispatchState("sending")

    // Simulate USSD dispatch (2 second delay)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Generate random citizen ID for demo
    const citizenId = Math.floor(1000 + Math.random() * 9000)

    setDispatchState("sent")
    toast.success(`Citizen #${citizenId} alerted`, {
      description: "Verification request dispatched via USSD",
    })
  }

  return (
    <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-amber-400 font-mono text-sm">
          &gt; {request.question}
        </h4>
        <RiskBadge level={request.priority} size="sm" />
      </div>

      <p className="text-slate-400 text-sm mb-2">{request.context}</p>

      {/* Required data point */}
      <div className="flex items-center gap-2 mt-3 p-2 rounded bg-slate-900/50">
        <Camera className="w-4 h-4 text-cyan-400" />
        <span className="text-cyan-400 text-xs font-medium">REQUIRED:</span>
        <span className="text-slate-300 text-xs">{request.data_point_needed}</span>
      </div>

      {/* Dispatch button */}
      <div className="mt-4">
        <Button
          onClick={handleDispatch}
          disabled={dispatchState !== "idle"}
          variant="outline"
          size="sm"
          className={`w-full transition-all duration-300 ${
            dispatchState === "sent"
              ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
              : dispatchState === "sending"
              ? "border-amber-500/50 text-amber-400"
              : "border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
          }`}
        >
          {dispatchState === "idle" && (
            <>
              <Send className="w-4 h-4 mr-2" />
              Dispatch to Field Agent
            </>
          )}
          {dispatchState === "sending" && (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          )}
          {dispatchState === "sent" && (
            <>
              <Check className="w-4 h-4 mr-2" />
              Sent via USSD
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
