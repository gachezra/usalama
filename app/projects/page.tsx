"use client"

import { useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Search, Filter, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import SiteHeader from "@/components/site-header"

// Dynamically import the map component with SSR disabled
const PublicMap = dynamic(() => import("@/components/public-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] lg:h-full min-h-[400px] rounded-xl border border-border bg-sand/20 animate-pulse flex items-center justify-center">
      <p className="text-foreground/50 font-serif tracking-widest uppercase">Loading interactive map...</p>
    </div>
  ),
})

type ProjectStatus = "Finished" | "In Progress" | "Stalled" | "Tendered"

// Mock data for projects
const mockProjects = [
  { id: "1", title: "Narok County Hospital Upgrade", county: "Narok", status: "In Progress" as ProjectStatus, total_budget: 45000000 },
  { id: "2", title: "Mombasa Port Access Road", county: "Mombasa", status: "Finished" as ProjectStatus, total_budget: 1200000000 },
  { id: "3", title: "Kisumu Water Treatment Plant", county: "Kisumu", status: "Stalled" as ProjectStatus, total_budget: 85000000 },
  { id: "4", title: "Nairobi Commuter Rail Extension", county: "Nairobi", status: "Tendered" as ProjectStatus, total_budget: 3000000000 },
  { id: "5", title: "Eldoret Tech Hub Hub", county: "Uasin Gishu", status: "In Progress" as ProjectStatus, total_budget: 250000000 },
  { id: "6", title: "Machakos Solar Farm", county: "Machakos", status: "Finished" as ProjectStatus, total_budget: 600000000 },
  { id: "7", title: "Turkana Wind Power Substation", county: "Turkana", status: "Stalled" as ProjectStatus, total_budget: 450000000 },
  { id: "8", title: "Nakuru City Market Expansion", county: "Nakuru", status: "Tendered" as ProjectStatus, total_budget: 150000000 },
]

const statusColors = {
  "Finished": "bg-forest/10 text-forest border-forest/20",
  "In Progress": "bg-terracotta/10 text-terracotta border-terracotta/20",
  "Tendered": "bg-amber-500/10 text-amber-700 border-amber-500/20",
  "Stalled": "bg-maasai/10 text-maasai border-maasai/20",
}

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "All">("All")

  const filteredProjects = mockProjects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          project.county.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "All" || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-background text-foreground font-sans tracking-wide">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-6 py-12 pt-32 md:pt-48">
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-[1px] bg-terracotta" />
            <span className="text-sm tracking-widest uppercase font-medium text-terracotta">Public Registry</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-normal leading-[1.1] mb-6">
            Explore <span className="italic text-terracotta">Tendered</span> Projects.
          </h1>
          <p className="text-xl text-foreground/70 max-w-2xl font-light">
            Search our nationwide database. See where your taxes go, track project statuses, and join citizens in holding government accountable.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:h-[700px]">
          {/* Map Column */}
          <div className="lg:col-span-7 rounded-xl overflow-hidden shadow-sm">
             <PublicMap projects={filteredProjects} />
          </div>

          {/* List Column */}
          <div className="lg:col-span-5 flex flex-col h-full">
            {/* Search and Filters */}
            <div className="bg-sand/30 p-6 rounded-xl border border-border/50 mb-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  type="text"
                  placeholder="Search by project name or county..."
                  className="w-full bg-white border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta font-sans transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <Filter className="w-4 h-4 text-foreground/50 mr-2 flex-shrink-0" />
                {["All", "In Progress", "Finished", "Tendered", "Stalled"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as ProjectStatus | "All")}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      statusFilter === status
                        ? "bg-foreground text-sand border-foreground"
                        : "bg-white text-foreground/70 border-border hover:border-terracotta hover:text-terracotta"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl bg-sand/10">
                  <p className="text-foreground/50">No projects found matching your criteria.</p>
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <div key={project.id} className="bg-white border border-border/50 p-5 rounded-xl hover:border-terracotta/50 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg leading-tight group-hover:text-terracotta transition-colors">
                        {project.title}
                      </h3>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border ${statusColors[project.status]}`}>
                        {project.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-foreground/60 mb-4 font-light">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {project.county}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                       <div>
                         <p className="text-[10px] uppercase tracking-widest text-foreground/50">Total Budget</p>
                         <p className="font-mono font-medium">KES {project.total_budget.toLocaleString()}</p>
                       </div>
                       <Button variant="ghost" className="text-xs hover:text-terracotta hover:bg-terracotta/5">
                         View Details
                       </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
