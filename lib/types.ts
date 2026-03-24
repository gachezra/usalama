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
 * Dispatched verification task (mirrors backend DispatchResponse)
 */
export interface DispatchTask {
  id: string
  project_id: string
  audit_log_id: string
  citizen_id: string | null
  question: string
  context: string
  data_point_needed: string
  priority: string
  gps_target_lat: number | null
  gps_target_lng: number | null
  radius_meters: number
  status: string
  assigned_at: string | null
  deadline: string | null
  created_at: string
}

/**
 * Batch dispatch response from backend
 */
export interface DispatchBatchResponse {
  dispatched: number
  tasks: DispatchTask[]
}

/**
 * Citizen verification submission response
 */
export interface VerificationResponse {
  id: string
  project_id: string
  citizen_id: string | null
  request_id: string | null
  gps_lat: number
  gps_lng: number
  photo_url: string
  photo_hash: string | null
  is_off_site: boolean
  status: string
  submitted_at: string
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
