"use client"

import { useState } from "react"
import { Database, Lock, Clock, ExternalLink, Fingerprint, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface LedgerEntry {
  hash: string
  fullHash: string
  timestamp: string
  action: string
  details: string
  status: "locked" | "pending" | "processing"
}

const ledgerData: LedgerEntry[] = [
  {
    hash: "0x7d...a92",
    fullHash: "0x7d9f2a1b8c3e4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9a92",
    timestamp: "2024-11-20 10:42:15",
    action: "Risk Flagged",
    details: "Project #892 - Bridge B4 Labor Cost Anomaly",
    status: "locked",
  },
  {
    hash: "0x3a...b11",
    fullHash: "0x3a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9b11",
    timestamp: "2024-11-20 10:45:33",
    action: "Citizen Payout",
    details: "Verification Reward - Citizen #882",
    status: "pending",
  },
  {
    hash: "0x9c...d44",
    fullHash: "0x9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9d44",
    timestamp: "2024-11-20 10:38:02",
    action: "Audit Complete",
    details: "Project #145 - Road Construction Verified",
    status: "locked",
  },
  {
    hash: "0x2e...f77",
    fullHash: "0x2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2f77",
    timestamp: "2024-11-20 10:35:18",
    action: "Document Scanned",
    details: "Tender TENDER-2024-892-BRIDGE analyzed",
    status: "locked",
  },
  {
    hash: "0x6b...e33",
    fullHash: "0x6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6e33",
    timestamp: "2024-11-20 10:30:45",
    action: "Risk Flagged",
    details: "Project #445 - Material Cost Review",
    status: "locked",
  },
  {
    hash: "0x1f...a88",
    fullHash: "0x1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1a88",
    timestamp: "2024-11-20 10:28:12",
    action: "Citizen Payout",
    details: "Verification Reward - Citizen #1204",
    status: "locked",
  },
]

export default function LedgerPage() {
  const [isCommitting, setIsCommitting] = useState(false)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const handleCommit = async () => {
    setIsCommitting(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsCommitting(false)
    toast.success("Session committed to Polygon Mainnet", {
      description: "Transaction hash: 0x8f...c29",
      icon: <CheckCircle className="w-4 h-4" />,
    })
  }

  const getStatusBadge = (status: LedgerEntry["status"]) => {
    switch (status) {
      case "locked":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">
            <Lock className="w-3 h-3 mr-1" />
            LOCKED ON POLYGON
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            PENDING
          </Badge>
        )
      case "processing":
        return (
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30">
            <Clock className="w-3 h-3 mr-1 animate-spin" />
            PROCESSING
          </Badge>
        )
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <span>National Oversight</span>
            <span>/</span>
            <span className="text-white">Blockchain Ledger</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Immutable Audit Trail</h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 glass rounded-lg">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-slate-300">Connected to</span>
          <span className="text-cyan-400 font-semibold">Polygon Mainnet</span>
        </div>
      </div>

      {/* Ledger Table */}
      <Card className="glass border-slate-700/50">
        <CardHeader className="border-b border-slate-700/50">
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Transaction Hash
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {ledgerData.map((entry) => (
                  <tr
                    key={entry.hash}
                    className={cn(
                      "transition-colors",
                      hoveredRow === entry.hash ? "bg-slate-800/50" : "hover:bg-slate-800/30",
                    )}
                    onMouseEnter={() => setHoveredRow(entry.hash)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-cyan-400 font-mono text-sm">{entry.hash}</code>
                        <button
                          className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-colors"
                          title="View on Explorer"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300 font-mono text-sm">{entry.timestamp}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "font-medium text-sm",
                          entry.action === "Risk Flagged" && "text-red-400",
                          entry.action === "Citizen Payout" && "text-green-400",
                          entry.action === "Audit Complete" && "text-cyan-400",
                          entry.action === "Document Scanned" && "text-slate-300",
                        )}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-400 text-sm">{entry.details}</span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(entry.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Commit Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleCommit}
          disabled={isCommitting}
          size="lg"
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-12 h-14 text-lg shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/30"
        >
          {isCommitting ? (
            <>
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-3" />
              Committing...
            </>
          ) : (
            <>
              <Fingerprint className="w-5 h-5 mr-3" />
              Commit Session to Mainnet
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
