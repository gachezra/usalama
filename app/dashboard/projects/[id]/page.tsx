"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  FileText,
  MapPin,
  Building2,
  RefreshCw,
  Scale,
  Map,
  Upload,
  Shield,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import { VerificationCard } from "@/components/dashboard/verification-card"
import { fetchProject, uploadDocument, auditProject, formatKES } from "@/lib/api"
import type { ProjectDetail, CorruptionFlag } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Dynamic import for map component (SSR disabled - required for Leaflet)
const ProjectMap = dynamic(
  () => import("@/components/dashboard/project-map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] bg-slate-800/50 rounded-lg animate-pulse flex items-center justify-center border border-slate-700/50">
        <div className="text-center">
          <Map className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <span className="text-slate-500 text-sm">Loading map...</span>
        </div>
      </div>
    ),
  }
)

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isAuditing, setIsAuditing] = useState(false)

  const loadProject = async () => {
    if (!params.id) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProject(params.id as string)
      setProject(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProject()
  }, [params.id])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !params.id) return

    setUploading(true)
    let successCount = 0
    let failCount = 0

    for (const file of Array.from(files)) {
      try {
        await uploadDocument(params.id as string, file)
        successCount++
        toast.success(`Uploaded: ${file.name}`)
      } catch (err) {
        failCount++
        toast.error(
          err instanceof Error ? err.message : `Failed to upload ${file.name}`
        )
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    setUploading(false)

    if (successCount > 0) {
      toast.success(`${successCount} document${successCount > 1 ? "s" : ""} processed and hashed`)
      loadProject()
    }
  }

  const handleAudit = async () => {
    if (!params.id) return
    setIsAuditing(true)
    try {
      await auditProject(params.id as string)
      toast.success("Forensic audit complete")
      loadProject()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Audit failed"
      )
    } finally {
      setIsAuditing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
          <Skeleton className="h-4 w-[200px] bg-slate-700/50" />
        </div>
        <Skeleton className="h-8 w-[300px] bg-slate-700/50" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] bg-slate-700/50 rounded-lg" />
          <Skeleton className="h-[400px] bg-slate-700/50 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <AlertTriangle className="w-12 h-12 text-rose-400 mb-4" />
        <p className="text-slate-400 mb-4">{error}</p>
        <div className="flex gap-4">
          <Button
            onClick={() => router.push("/dashboard/projects")}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          <Button
            onClick={loadProject}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!project) return null

  const verdict = project.latest_verdict
  const hasDocuments = project.documents && project.documents.length > 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
          <Link
            href="/dashboard/projects"
            className="hover:text-white transition-colors"
          >
            Projects
          </Link>
          <span>/</span>
          <span className="text-white">{project.title}</span>
        </div>
        <div className="flex items-start justify-between mt-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{project.title}</h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {project.contractor_name}
            </p>
          </div>
          <RiskBadge level={project.risk_level} score={project.risk_score} size="lg" />
        </div>

        {/* Project Meta */}
        <div className="flex flex-wrap gap-4 mt-4">
          <Badge
            variant="outline"
            className="border-slate-700 text-slate-300 px-3 py-1"
          >
            <MapPin className="w-3 h-3 mr-1" />
            {project.county}
          </Badge>
          <Badge
            variant="outline"
            className="border-slate-700 text-slate-300 px-3 py-1 font-mono"
          >
            {formatKES(project.total_budget)}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "px-3 py-1",
              project.status === "FLAGGED" && "border-rose-500/50 text-rose-400",
              project.status === "ACTIVE" && "border-emerald-500/50 text-emerald-400",
              project.status === "STALLED" && "border-amber-500/50 text-amber-400",
              project.status === "COMPLETED" && "border-cyan-500/50 text-cyan-400",
              project.status === "PLANNED" && "border-slate-500/50 text-slate-400"
            )}
          >
            {project.status}
          </Badge>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Map, Upload & Documents */}
        <div className="space-y-6">
          {/* Project Location Map */}
          <Card className="glass border-slate-700/50">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Map className="w-5 h-5 text-cyan-400" />
                Project Location
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ProjectMap
                county={project.county}
                title={project.title}
                riskLevel={project.risk_level}
              />
            </CardContent>
          </Card>

          {/* Upload Dropzone */}
          <Card className="glass border-slate-700/50">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Upload className="w-5 h-5 text-cyan-400" />
                Upload Tender Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  uploading
                    ? "border-slate-600 bg-slate-800/30 cursor-wait"
                    : "border-slate-600 hover:border-cyan-500/50 hover:bg-cyan-500/5"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {uploading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-spin" />
                    <p className="text-slate-300 text-sm">Processing documents...</p>
                    <p className="text-slate-500 text-xs mt-1">Extracting text and computing SHA-256 hash</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-300 text-sm">Click to upload PDF documents</p>
                    <p className="text-slate-500 text-xs mt-1">PDF files only. Each document will be hashed for blockchain verification.</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card className="glass border-slate-700/50">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <FileText className="w-5 h-5 text-cyan-400" />
                Uploaded Documents ({project.documents?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {!project.documents || project.documents.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">
                  No documents uploaded
                </p>
              ) : (
                <div className="space-y-2">
                  {project.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <div>
                          <Badge
                            variant="outline"
                            className="border-cyan-500/30 text-cyan-400 text-xs"
                          >
                            {doc.doc_type}
                          </Badge>
                          <p className="text-slate-500 text-xs mt-1 font-mono truncate max-w-[200px]">
                            {doc.file_hash?.slice(0, 16) || "Pending"}...
                          </p>
                        </div>
                      </div>
                      <span className="text-slate-500 text-xs">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Audit & Intelligence */}
        <div className="space-y-6">
          {/* Audit Trigger */}
          <Card className="glass border-slate-700/50 border-cyan-500/20">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Shield className="w-5 h-5 text-cyan-400" />
                Forensic Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {isAuditing ? (
                <div className="py-6 text-center">
                  <Loader2 className="w-10 h-10 text-cyan-400 mx-auto mb-3 animate-spin" />
                  <p className="text-cyan-400 font-medium">Analysis in Progress...</p>
                  <p className="text-slate-500 text-xs mt-2">
                    ForensicBrain is cross-referencing documents, detecting anomalies, and scoring risk.
                  </p>
                </div>
              ) : (
                <>
                  <Button
                    onClick={handleAudit}
                    disabled={!hasDocuments}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    INITIALIZE FORENSIC AUDIT
                  </Button>
                  {!hasDocuments && (
                    <p className="text-slate-500 text-xs text-center mt-3">
                      Upload Tender Documents to begin Analysis
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Executive Summary */}
          {verdict?.executive_summary && (
            <Card className="glass border-slate-700/50">
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Scale className="w-5 h-5 text-cyan-400" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-slate-300 text-sm leading-relaxed">
                  {verdict.executive_summary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Red Flags Section */}
          <Card className="glass border-slate-700/50 border-rose-500/20">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Red Flags ({verdict?.flags?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {!verdict?.flags || verdict.flags.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">
                  No red flags detected
                </p>
              ) : (
                <div className="space-y-4">
                  {verdict.flags.map((flag: CorruptionFlag, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-white font-medium text-sm">
                          {flag.rule_broken}
                        </h4>
                        <RiskBadge level={flag.severity} size="sm" />
                      </div>
                      <p className="text-slate-400 text-sm mb-3 italic">
                        &ldquo;{flag.evidence}&rdquo;
                      </p>
                      {flag.legal_implication && (
                        <p className="text-rose-400/80 text-xs mb-2">
                          {flag.legal_implication}
                        </p>
                      )}
                      {flag.document_sources && flag.document_sources.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {flag.document_sources.map((source, sIdx) => (
                            <Badge
                              key={sIdx}
                              variant="outline"
                              className="border-slate-600 text-slate-400 text-xs"
                            >
                              {source}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clarification Requests Section */}
          <Card className="glass border-slate-700/50 border-amber-500/20">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Camera className="w-5 h-5 text-amber-400" />
                Verification Requests ({verdict?.clarifications_needed?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {!verdict?.clarifications_needed ||
              verdict.clarifications_needed.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">
                  No verification requests
                </p>
              ) : (
                <div className="space-y-4">
                  {verdict.clarifications_needed.map((req, idx) => (
                    <VerificationCard key={idx} request={req} index={idx} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Back Button */}
      <div className="pt-4">
        <Button
          onClick={() => router.push("/dashboard/projects")}
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    </div>
  )
}
