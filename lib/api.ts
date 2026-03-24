const API_BASE = "http://localhost:8000/api/v1"

/**
 * Fetch all projects from the backend
 */
export async function fetchProjects() {
  const response = await fetch(`${API_BASE}/projects/`)
  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Fetch a single project by ID
 */
export async function fetchProject(id: string) {
  const response = await fetch(`${API_BASE}/projects/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch project: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Create a new project
 */
export async function createProject(data: {
  title: string
  contractor_name: string
  county: string
  constituency: string
  total_budget: number
  description?: string
}) {
  const response = await fetch(`${API_BASE}/projects/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || `Failed to create project: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Upload a PDF document to a project
 */
export async function uploadDocument(projectId: string, file: File) {
  const formData = new FormData()
  formData.append("file", file)
  const response = await fetch(`${API_BASE}/projects/${projectId}/upload`, {
    method: "POST",
    body: formData,
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || `Failed to upload document: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Trigger forensic audit on a project
 */
export async function auditProject(projectId: string) {
  const response = await fetch(`${API_BASE}/projects/${projectId}/audit`, {
    method: "POST",
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || `Failed to audit project: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Dispatch verification requests to field agents for a project
 */
export async function dispatchVerification(projectId: string, payload: object = {}): Promise<import("@/lib/types").DispatchBatchResponse> {
  const response = await fetch(`${API_BASE}/projects/${projectId}/dispatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || `Failed to dispatch verification: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Fetch a verification task by ID (for citizen UI)
 */
export async function fetchVerificationTask(requestId: string): Promise<import("@/lib/types").DispatchTask> {
  const response = await fetch(`${API_BASE}/verifications/${requestId}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch verification task: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Submit citizen verification evidence (photo + GPS)
 */
export async function submitVerificationEvidence(requestId: string, formData: FormData): Promise<import("@/lib/types").VerificationResponse> {
  const response = await fetch(`${API_BASE}/verifications/${requestId}/submit`, {
    method: "POST",
    body: formData,
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || `Failed to submit verification: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Format amount as Kenyan Shillings
 * @example formatKES(15000000) => "KES 15,000,000"
 */
export function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`
}
