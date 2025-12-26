"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface ProjectDot {
  id: string
  name: string
  location: string
  budget: string
  status: "safe" | "risk"
  x: number
  y: number
}

const projects: ProjectDot[] = [
  { id: "1", name: "Road Construction A1", location: "Nairobi", budget: "45M KES", status: "safe", x: 55, y: 65 },
  { id: "2", name: "Bridge B4", location: "Mombasa", budget: "120M KES", status: "safe", x: 60, y: 85 },
  { id: "3", name: "Borehole 4B", location: "Turkana", budget: "12M KES", status: "risk", x: 42, y: 20 },
  { id: "4", name: "Hospital Wing", location: "Kisumu", budget: "200M KES", status: "safe", x: 32, y: 55 },
  { id: "5", name: "School Renovation", location: "Nakuru", budget: "8M KES", status: "risk", x: 42, y: 52 },
  { id: "6", name: "Water Pipeline", location: "Eldoret", budget: "65M KES", status: "safe", x: 35, y: 45 },
  { id: "7", name: "Power Station", location: "Garissa", budget: "180M KES", status: "risk", x: 75, y: 55 },
  { id: "8", name: "Market Complex", location: "Nyeri", budget: "25M KES", status: "safe", x: 48, y: 52 },
]

export function KenyaMap() {
  const [hoveredProject, setHoveredProject] = useState<ProjectDot | null>(null)

  return (
    <div className="relative w-full h-full bg-slate-900/50 rounded-lg overflow-hidden">
      {/* Grid pattern background */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      {/* Kenya outline (simplified) */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ padding: "20px" }}>
        {/* Simplified Kenya shape */}
        <path
          d="M45,10 L55,8 L65,15 L75,20 L85,35 L80,50 L75,65 L65,80 L55,90 L45,88 L35,80 L25,70 L20,55 L25,40 L30,25 L40,15 Z"
          fill="none"
          stroke="rgba(6, 182, 212, 0.3)"
          strokeWidth="0.5"
          className="drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]"
        />

        {/* County grid lines */}
        <line x1="30" y1="40" x2="70" y2="40" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="0.3" />
        <line x1="35" y1="55" x2="75" y2="55" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="0.3" />
        <line x1="40" y1="70" x2="65" y2="70" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="0.3" />
        <line x1="50" y1="15" x2="50" y2="85" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="0.3" />
      </svg>

      {/* Project dots */}
      {projects.map((project) => (
        <div
          key={project.id}
          className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${project.x}%`, top: `${project.y}%` }}
          onMouseEnter={() => setHoveredProject(project)}
          onMouseLeave={() => setHoveredProject(null)}
        >
          <div
            className={cn(
              "relative w-3 h-3 rounded-full pulse-dot",
              project.status === "safe"
                ? "bg-green-400 before:bg-green-400"
                : "bg-red-500 before:bg-red-500 animate-pulse",
            )}
          />
        </div>
      ))}

      {/* Tooltip */}
      {hoveredProject && (
        <div
          className="absolute z-50 glass rounded-lg p-3 min-w-[200px] pointer-events-none"
          style={{
            left: `${Math.min(hoveredProject.x + 5, 70)}%`,
            top: `${Math.min(hoveredProject.y + 5, 70)}%`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className={cn("w-2 h-2 rounded-full", hoveredProject.status === "safe" ? "bg-green-400" : "bg-red-500")}
            />
            <span className="text-white font-semibold text-sm">{hoveredProject.name}</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Location:</span>
              <span className="text-slate-200">{hoveredProject.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Budget:</span>
              <span className="text-cyan-400 font-mono">{hoveredProject.budget}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className={hoveredProject.status === "safe" ? "text-green-400" : "text-red-400"}>
                {hoveredProject.status === "safe" ? "VERIFIED" : "ANOMALY DETECTED"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-slate-400">Safe</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-slate-400">High Risk</span>
        </div>
      </div>
    </div>
  )
}
