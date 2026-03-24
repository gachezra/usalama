"use client"

import { useState } from "react"
import { Camera, Send, Check, Loader2, Link2, ExternalLink, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import { dispatchVerification } from "@/lib/api"
import type { ClarificationRequest, DispatchTask } from "@/lib/types"
import { toast } from "sonner"

interface VerificationCardProps {
  request: ClarificationRequest
  index: number
  projectId: string
}

type DispatchState = "idle" | "sending" | "sent"

export function VerificationCard({ request, index, projectId }: VerificationCardProps) {
  const [dispatchState, setDispatchState] = useState<DispatchState>("idle")
  const [dispatchedTasks, setDispatchedTasks] = useState<DispatchTask[]>([])

  const handleDispatch = async () => {
    setDispatchState("sending")
    try {
      const result = await dispatchVerification(projectId, {})
      setDispatchState("sent")
      setDispatchedTasks(result.tasks)
      toast.success(`${result.dispatched} verification request${result.dispatched !== 1 ? "s" : ""} dispatched`, {
        description: "Field agents alerted via USSD",
      })
    } catch (err) {
      setDispatchState("idle")
      toast.error(err instanceof Error ? err.message : "Dispatch failed")
    }
  }

  const handleCopyLink = (taskId: string) => {
    const link = `${window.location.origin}/verify?task=${taskId}`
    navigator.clipboard.writeText(link)
    toast.success("Link copied to clipboard")
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

      {/* Dispatched task links */}
      {dispatchedTasks.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link2 className="w-3 h-3" />
            <span>Citizen Verification Links:</span>
          </div>
          {dispatchedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 p-2 rounded bg-slate-900/50 border border-slate-700/30"
            >
              <span className="text-xs text-slate-300 truncate flex-1 font-mono">
                /verify?task={task.id.slice(0, 8)}...
              </span>
              <button
                onClick={() => handleCopyLink(task.id)}
                className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-cyan-400 transition-colors"
                title="Copy link"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <a
                href={`/verify?task=${task.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-emerald-400 transition-colors"
                title="Open citizen view"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
