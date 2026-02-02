"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FolderKanban, AlertTriangle, Building2, RefreshCw, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import { fetchProjects, createProject, formatKES } from "@/lib/api"
import { KENYA_COUNTIES } from "@/lib/kenya-counties"
import type { Project } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const countyNames = Object.keys(KENYA_COUNTIES).sort()

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    contractor_name: "",
    county: "",
    constituency: "",
    total_budget: "",
  })

  const loadProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProjects()
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.title.length < 5) {
      toast.error("Title must be at least 5 characters")
      return
    }
    if (!formData.contractor_name.trim()) {
      toast.error("Contractor name is required")
      return
    }
    if (!formData.county) {
      toast.error("Please select a county")
      return
    }
    if (!formData.constituency.trim()) {
      toast.error("Constituency is required")
      return
    }
    const budget = Number(formData.total_budget)
    if (!budget || budget <= 0) {
      toast.error("Budget must be greater than 0")
      return
    }

    setSubmitting(true)
    try {
      await createProject({
        title: formData.title,
        contractor_name: formData.contractor_name,
        county: formData.county,
        constituency: formData.constituency,
        total_budget: budget,
      })
      toast.success("Project registered in USALAMA system")
      setIsModalOpen(false)
      setFormData({ title: "", contractor_name: "", county: "", constituency: "", total_budget: "" })
      loadProjects()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setSubmitting(false)
    }
  }

  const flaggedCount = projects.filter(
    (p) => p.risk_level === "HIGH" || p.risk_level === "CRITICAL"
  ).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <span>National Oversight</span>
            <span>/</span>
            <span className="text-white">Projects Database</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Government Projects</h1>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass border-slate-700/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-cyan-500/10">
              <FolderKanban className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Projects</p>
              <p className="text-2xl font-bold text-white font-mono">
                {loading ? "-" : projects.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-slate-700/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-rose-500/10">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Flagged Projects</p>
              <p className="text-2xl font-bold text-rose-400 font-mono">
                {loading ? "-" : flaggedCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-slate-700/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Active Projects</p>
              <p className="text-2xl font-bold text-emerald-400 font-mono">
                {loading ? "-" : projects.filter((p) => p.status === "ACTIVE").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-slate-700/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Stalled Projects</p>
              <p className="text-2xl font-bold text-amber-400 font-mono">
                {loading ? "-" : projects.filter((p) => p.status === "STALLED").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card className="glass border-slate-700/50">
        <CardHeader className="border-b border-slate-700/50">
          <CardTitle className="text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-cyan-400" />
            Projects Registry
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-[200px] bg-slate-700/50" />
                  <Skeleton className="h-4 w-[150px] bg-slate-700/50" />
                  <Skeleton className="h-4 w-[100px] bg-slate-700/50" />
                  <Skeleton className="h-4 w-[120px] bg-slate-700/50" />
                  <Skeleton className="h-4 w-[80px] bg-slate-700/50" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">{error}</p>
              <Button
                onClick={loadProjects}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center">
              <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No projects found</p>
              <p className="text-slate-500 text-sm mt-1">
                Click &quot;New Project&quot; to register one.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Project Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Contractor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      County
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Risk
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {projects.map((project) => (
                    <tr
                      key={project.id}
                      className={cn(
                        "transition-colors cursor-pointer",
                        hoveredRow === project.id
                          ? "bg-slate-800/50"
                          : "hover:bg-slate-800/30"
                      )}
                      onMouseEnter={() => setHoveredRow(project.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">
                            {project.title}
                          </span>
                          <span className="text-xs text-slate-500">
                            {project.document_count} document
                            {project.document_count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-300">{project.contractor_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400">{project.county}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-300 font-mono text-sm">
                          {formatKES(project.total_budget)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <RiskBadge
                          level={project.risk_level}
                          score={project.risk_score}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Project Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#0F172A] border-slate-700/50 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Register New Project</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a government project to the USALAMA oversight system.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Project Title</Label>
              <Input
                placeholder="e.g. Narok-Kilgoris Road Construction"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                required
                minLength={5}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Contractor Name</Label>
              <Input
                placeholder="e.g. ABC Construction Ltd"
                value={formData.contractor_name}
                onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">County</Label>
                <select
                  value={formData.county}
                  onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-1 text-sm text-white shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
                  required
                >
                  <option value="" className="bg-slate-900">Select county...</option>
                  {countyNames.map((name) => (
                    <option key={name} value={name} className="bg-slate-900">
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Constituency</Label>
                <Input
                  placeholder="e.g. Kilgoris"
                  value={formData.constituency}
                  onChange={(e) => setFormData({ ...formData, constituency: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Budget (KES)</Label>
              <Input
                type="number"
                placeholder="e.g. 15000000"
                value={formData.total_budget}
                onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 font-mono"
                required
                min={1}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {submitting ? "Registering..." : "Register Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
