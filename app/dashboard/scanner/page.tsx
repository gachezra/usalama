"use client"

import { useState } from "react"
import { Play, FileText, AlertTriangle, CheckCircle, Building2, Coins, Users, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface AnalysisField {
  label: string
  value: string
  icon: typeof Building2
  status: "verified" | "warning" | "pending"
}

const mockAnalysisData: AnalysisField[] = [
  { label: "Project Name", value: "Bridge B4 - Turkana County", icon: FileText, status: "verified" },
  { label: "Contractor", value: "Apex Construction Ltd", icon: Building2, status: "verified" },
  { label: "Material Cost", value: "50,000,000 KES", icon: Coins, status: "verified" },
  { label: "Labor Cost", value: "200,000,000 KES", icon: Users, status: "warning" },
]

export default function ScannerPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanComplete, setScanComplete] = useState(false)
  const [analysisData, setAnalysisData] = useState<AnalysisField[]>([])

  const handleRunAnalysis = async () => {
    setIsScanning(true)
    setScanComplete(false)
    setAnalysisData([])

    // Simulate scanning delay
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Reveal analysis data one by one
    for (let i = 0; i < mockAnalysisData.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setAnalysisData((prev) => [...prev, mockAnalysisData[i]])
    }

    setIsScanning(false)
    setScanComplete(true)
  }

  const resetScan = () => {
    setIsScanning(false)
    setScanComplete(false)
    setAnalysisData([])
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
          <span>National Oversight</span>
          <span>/</span>
          <span className="text-white">AI Document Scanner</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Tender Analysis Engine</h1>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-2 gap-6 h-[calc(100vh-180px)]">
        {/* Left: Document Viewer */}
        <Card className="glass border-slate-700/50 overflow-hidden">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Source Document
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-65px)] relative">
            {/* Mock PDF Document */}
            <div className="absolute inset-0 p-6 overflow-hidden bg-slate-900/30">
              <div className="bg-white/95 rounded-lg p-8 h-full overflow-hidden relative">
                {/* Document Header */}
                <div className="border-b border-slate-200 pb-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-32 h-6 bg-slate-200 rounded" />
                    <div className="w-24 h-4 bg-slate-100 rounded" />
                  </div>
                  <div className="w-48 h-8 bg-slate-800 rounded mt-2" />
                </div>

                {/* Document Content Lines */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="w-32 h-3 bg-slate-300 rounded" />
                    <div className="w-full h-3 bg-slate-100 rounded" />
                    <div className="w-4/5 h-3 bg-slate-100 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-28 h-3 bg-slate-300 rounded" />
                    <div className="w-full h-3 bg-slate-100 rounded" />
                    <div className="w-3/4 h-3 bg-slate-100 rounded" />
                    <div className="w-5/6 h-3 bg-slate-100 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-36 h-3 bg-slate-300 rounded" />
                    <div className="w-full h-3 bg-slate-100 rounded" />
                    <div className="w-2/3 h-3 bg-slate-100 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-40 h-3 bg-slate-300 rounded" />
                    <div className="flex gap-8 mt-2">
                      <div className="w-32 h-8 bg-slate-200 rounded" />
                      <div className="w-32 h-8 bg-slate-200 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-24 h-3 bg-slate-300 rounded" />
                    <div className="w-full h-3 bg-slate-100 rounded" />
                    <div className="w-4/5 h-3 bg-slate-100 rounded" />
                  </div>
                </div>

                {/* Scanning Beam */}
                {isScanning && (
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan shadow-[0_0_20px_rgba(6,182,212,0.8)]" />
                )}
              </div>
            </div>

            {/* Document Label */}
            <div className="absolute bottom-4 left-4 px-3 py-1.5 glass rounded-lg">
              <span className="text-xs text-slate-400">TENDER-2024-892-BRIDGE.pdf</span>
            </div>
          </CardContent>
        </Card>

        {/* Right: Analysis Output */}
        <Card className="glass border-slate-700/50 flex flex-col">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  {isScanning && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  )}
                  <span
                    className={cn(
                      "relative inline-flex rounded-full h-2 w-2",
                      isScanning ? "bg-cyan-400" : scanComplete ? "bg-green-400" : "bg-slate-500",
                    )}
                  />
                </span>
                AI Extraction Output
              </span>
              {scanComplete && (
                <Button variant="ghost" size="sm" onClick={resetScan} className="text-slate-400 hover:text-white">
                  Reset
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-6 flex flex-col">
            {/* Analysis Action */}
            {!isScanning && !scanComplete && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6 border border-cyan-500/30">
                  <Play className="w-10 h-10 text-cyan-400 ml-1" />
                </div>
                <h3 className="text-lg text-white font-semibold mb-2">Ready to Analyze</h3>
                <p className="text-slate-400 text-sm text-center mb-6 max-w-xs">
                  Our AI will scan the tender document and extract key financial data for verification.
                </p>
                <Button
                  onClick={handleRunAnalysis}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-8"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Analysis
                </Button>
              </div>
            )}

            {/* Loading State */}
            {isScanning && analysisData.length === 0 && (
              <div className="flex-1 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <Skeleton className="h-4 w-24 mb-2 bg-slate-700" />
                    <Skeleton className="h-6 w-48 bg-slate-700" />
                  </div>
                ))}
              </div>
            )}

            {/* Analysis Results */}
            {analysisData.length > 0 && (
              <div className="flex-1 space-y-4">
                {analysisData.map((field, index) => (
                  <div
                    key={field.label}
                    className={cn(
                      "p-4 rounded-lg border transition-all duration-300 animate-in fade-in slide-in-from-right-4",
                      field.status === "warning"
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-slate-800/50 border-slate-700/50",
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            field.status === "warning" ? "bg-red-500/20 text-red-400" : "bg-cyan-500/20 text-cyan-400",
                          )}
                        >
                          <field.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-0.5">{field.label}</p>
                          <p
                            className={cn("font-semibold", field.status === "warning" ? "text-red-400" : "text-white")}
                          >
                            {field.value}
                          </p>
                        </div>
                      </div>
                      {field.status === "verified" ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                      )}
                    </div>
                  </div>
                ))}

                {/* Alert Card */}
                {scanComplete && (
                  <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-red-500/20">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-red-400 font-semibold mb-1">RISK DETECTED</h4>
                        <p className="text-sm text-slate-300">
                          Labor cost is <span className="text-red-400 font-bold">300% above</span> regional average for
                          similar bridge construction projects.
                        </p>
                      </div>
                    </div>
                    <Button className="w-full mt-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30">
                      <Flag className="w-4 h-4 mr-2" />
                      Flag for Audit
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
