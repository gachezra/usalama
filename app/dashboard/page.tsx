"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Activity, Shield, Users, AlertTriangle, CheckCircle, Map } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LiveFeed } from "@/components/dashboard/live-feed"
import { StatsCard } from "@/components/dashboard/stats-card"
import { fetchProjects } from "@/lib/api"
import type { Project } from "@/lib/types"

const ProjectMap = dynamic(
  () => import("@/components/dashboard/project-map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full bg-slate-800/50 rounded-lg animate-pulse flex items-center justify-center border border-slate-700/50">
        <div className="text-center">
          <Map className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <span className="text-slate-500 text-sm">Loading map...</span>
        </div>
      </div>
    ),
  }
)

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(() => {})
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <span>National Oversight</span>
            <span>/</span>
            <span className="text-white">Overview</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Command Center</h1>
        </div>

        {/* Ticker */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 glass rounded-lg">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-slate-300">Funds Secured:</span>
            <span className="text-cyan-400 font-bold font-mono">KES 4.2B</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 glass rounded-lg">
            <Activity className="w-4 h-4 text-green-400 animate-pulse" />
            <span className="text-sm text-slate-300">System Status:</span>
            <span className="text-green-400 font-semibold">Online</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Map Section */}
        <div className="col-span-8">
          <Card className="glass border-slate-700/50 h-[500px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                National Project Map
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-60px)]">
              <ProjectMap projects={projects} />
            </CardContent>
          </Card>
        </div>

        {/* Live Feed */}
        <div className="col-span-4">
          <LiveFeed />
        </div>

        {/* Stats Row */}
        <div className="col-span-12 grid grid-cols-4 gap-6">
          <StatsCard title="Active Audits" value="1,240" icon={Activity} trend="+12% this week" trendUp={true} />
          <StatsCard
            title="Risk Level"
            value="MODERATE"
            icon={AlertTriangle}
            trend="3 high-risk flags"
            variant="warning"
          />
          <StatsCard title="Citizen Reports" value="8,492" icon={Users} trend="+284 today" trendUp={true} />
          <StatsCard
            title="Verified Projects"
            value="892"
            icon={CheckCircle}
            trend="98.2% accuracy"
            variant="success"
          />
        </div>
      </div>
    </div>
  )
}
