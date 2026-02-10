// Risk and status enums matching backend PostgreSQL ENUMs
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
export type ProjectStatus = "PLANNED" | "ACTIVE" | "COMPLETED" | "STALLED" | "FLAGGED"
export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED"

/**
 * Project summary for list view
 */
export interface Project {
  id: string
  title: string
  county: string
  contractor_name: string
  total_budget: number
  risk_score: number
  risk_level: RiskLevel
  status: ProjectStatus
  document_count: number
  created_at?: string
  updated_at?: string
}

/**
 * Document attached to a project
 */
export interface Document {
  id: string
  doc_type: string
  file_url: string       // Matches backend DocumentResponse.file_url
  file_hash: string      // Matches backend DocumentResponse.file_hash
  uploaded_at: string
}

/**
 * Corruption flag raised by the Forensic Brain
 */
export interface CorruptionFlag {
  rule_broken: string
  severity: RiskLevel
  evidence: string
  legal_implication: string | null
  document_sources: string[]
}

/**
 * Clarification request for citizen verification
 */
export interface ClarificationRequest {
  question: string
  context: string
  data_point_needed: string
  priority: RiskLevel
}

/**
 * Full forensic verdict from AI analysis
 */
export interface ForensicVerdict {
  project_title: string
  contractor_risk_score: number
  flags: CorruptionFlag[]
  clarifications_needed: ClarificationRequest[]
  executive_summary: string
}

/**
 * Full project detail with forensic analysis
 */
export interface ProjectDetail extends Project {
  description?: string
  constituency?: string
  documents: Document[]
  latest_verdict?: ForensicVerdict
}
