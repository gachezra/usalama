"use client"

import type React from "react"

import { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Camera, CheckCircle, Loader2, Shield, Smartphone, AlertCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { fetchVerificationTask, submitVerificationEvidence } from "@/lib/api"
import type { DispatchTask } from "@/lib/types"

type VerificationState = "loading" | "instructions" | "task" | "analyzing" | "success" | "rejected" | "error"

// Pre-filled Narok GPS coordinates for demo
const DEMO_GPS = { lat: -1.0833, lng: 35.8667 }

function VerifyPageContent() {
  const searchParams = useSearchParams()
  const taskId = searchParams.get("task")

  const [state, setState] = useState<VerificationState>("loading")
  const [task, setTask] = useState<DispatchTask | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [showMpesaNotification, setShowMpesaNotification] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch task on mount
  useEffect(() => {
    if (!taskId) {
      setErrorMessage("No task ID provided. Please use the link sent to you.")
      setState("error")
      return
    }

    fetchVerificationTask(taskId)
      .then((data) => {
        setTask(data)
        setState("instructions")
      })
      .catch(() => {
        setErrorMessage("Invalid or expired verification link. Please contact the admin.")
        setState("error")
      })
  }, [taskId])

  const handleStartVerification = () => {
    setState("task")
  }

  const handleTakePhoto = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !taskId) return

    // Show preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)

    setState("analyzing")

    // Build FormData with exact field names matching backend
    const formData = new FormData()
    formData.append("file", file)
    formData.append("latitude", String(DEMO_GPS.lat))
    formData.append("longitude", String(DEMO_GPS.lng))

    try {
      const result = await submitVerificationEvidence(taskId, formData)

      if (result.status === "REJECTED" || result.is_off_site) {
        setState("rejected")
        return
      }

      // Generate client-side transaction ID for display
      const txId = "R" + Array.from(crypto.getRandomValues(new Uint8Array(4)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase()
      setTransactionId(txId)

      setState("success")
      setTimeout(() => setShowMpesaNotification(true), 500)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Submission failed")
      setState("error")
    }
  }

  const handleDone = () => {
    setState("instructions")
    setShowMpesaNotification(false)
    setCapturedImage(null)
  }

  // --- Loading State ---
  if (state === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-[#43B02A] animate-spin mb-4" />
        <p className="text-gray-500">Loading verification task...</p>
      </div>
    )
  }

  // --- Error State ---
  if (state === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Something Went Wrong</h1>
        <p className="text-gray-500 text-center max-w-md">{errorMessage}</p>
      </div>
    )
  }

  // --- Rejected State (off-site GPS) ---
  if (state === "rejected") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Verification Rejected</h1>
        <p className="text-gray-500 text-center max-w-md mb-6">
          Your GPS location does not match the project site. Please go to the correct location and try again.
        </p>
        <Button
          onClick={handleDone}
          variant="outline"
          className="h-12 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 bg-transparent"
        >
          Try Again
        </Button>
      </div>
    )
  }

  // --- Instructions State ---
  if (state === "instructions") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#43B02A]" />
            <span className="text-lg font-bold text-gray-900">USALAMA</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-[#43B02A]/10 flex items-center justify-center mb-6">
            <Smartphone className="w-10 h-10 text-[#43B02A]" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3 text-balance">Project Verification</h1>

          <p className="text-gray-600 mb-8 max-w-md">
            You have been selected to verify a government project in your area. Take a photo and earn{" "}
            <span className="font-bold text-[#43B02A]">KSH 50</span> via M-Pesa.
          </p>

          {/* Instructions Box */}
          <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 p-5 mb-8 text-left">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Before you start:
            </h2>
            <ul className="space-y-3 text-gray-600 text-sm">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#43B02A] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  <strong>Open this page on your phone</strong> if you are on a computer. You need to take a photo with
                  your phone camera.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#43B02A] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Go to the <strong>exact location</strong> mentioned in the task.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#43B02A] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Take a <strong>clear photo</strong> showing the current state of the project.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#43B02A] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  4
                </span>
                <span>
                  Receive your <strong>M-Pesa payment</strong> instantly after verification.
                </span>
              </li>
            </ul>
          </div>

          <Button
            onClick={handleStartVerification}
            className="w-full max-w-md h-14 bg-[#43B02A] hover:bg-[#3a9a24] text-white text-lg font-semibold rounded-xl"
          >
            I Understand, Let&apos;s Start
          </Button>
        </div>
      </div>
    )
  }

  // --- Task State ---
  if (state === "task" && task) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#43B02A]" />
            <span className="text-lg font-bold text-gray-900">USALAMA</span>
          </div>
        </div>

        <div className="flex-1 p-4">
          {/* Task Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Your Task</p>
              <h1 className="text-xl font-bold text-gray-900">{task.question}</h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-[#43B02A] rounded-full" />
                <span className="text-sm text-gray-600">{task.context || "Field verification required"}</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <h3 className="font-semibold text-amber-800 mb-2">Photo Instructions:</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• {task.data_point_needed}</li>
              <li>• Take the photo during daylight</li>
              <li>• Make sure the subject is clearly visible</li>
              <li>• Avoid blurry photos</li>
            </ul>
          </div>

          {/* Priority badge */}
          <div className="text-center mb-4">
            <span className={cn(
              "inline-block font-semibold px-4 py-2 rounded-full text-sm",
              task.priority === "CRITICAL" ? "bg-red-100 text-red-700" :
              task.priority === "HIGH" ? "bg-orange-100 text-orange-700" :
              "bg-[#43B02A]/10 text-[#43B02A]"
            )}>
              {task.priority === "CRITICAL" || task.priority === "HIGH"
                ? `${task.priority} PRIORITY — Earn KSH 50`
                : "Earn KSH 50 for this verification"
              }
            </span>
          </div>

          {/* Hidden file input for camera */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
            onClick={(e) => {
              (e.target as HTMLInputElement).value = ""
            }}
          />
        </div>

        {/* Bottom Action */}
        <div className="p-4 bg-white border-t border-gray-200">
          <Button
            onClick={handleTakePhoto}
            className="w-full h-14 bg-[#43B02A] hover:bg-[#3a9a24] text-white text-lg font-semibold rounded-xl"
          >
            <Camera className="w-6 h-6 mr-2" />
            Take Photo Now
          </Button>
        </div>
      </div>
    )
  }

  // --- Analyzing State ---
  if (state === "analyzing") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-[#43B02A]/10 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#43B02A] animate-spin" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Analyzing Photo...</h2>
        <p className="text-gray-500 text-center">Our AI is verifying the project status</p>

        {capturedImage && (
          <div className="mt-6 w-full max-w-sm">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-48 object-cover rounded-xl border border-gray-200"
            />
          </div>
        )}
      </div>
    )
  }

  // --- Success State ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      {/* Success Icon */}
      <div className="w-24 h-24 rounded-full bg-[#43B02A] flex items-center justify-center mb-6">
        <CheckCircle className="w-14 h-14 text-white" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Complete!</h1>
      <p className="text-gray-500 text-center mb-8">Thank you for helping fight corruption.</p>

      {/* M-Pesa Notification */}
      <div
        className={cn(
          "w-full max-w-sm bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-500",
          showMpesaNotification ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        <div className="bg-[#43B02A] px-4 py-3 flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-[#43B02A] font-bold text-sm">M</span>
          </div>
          <span className="text-white font-semibold">M-PESA</span>
        </div>
        <div className="p-4">
          <p className="text-gray-800">
            Confirmed. <span className="font-bold">Ksh 50.00</span> sent to your M-Pesa from{" "}
            <span className="font-bold">USALAMA</span>
          </p>
          <p className="text-gray-500 text-sm mt-2">Transaction ID: {transactionId}</p>
        </div>
      </div>

      {/* Done Button */}
      <div className="w-full max-w-sm mt-8">
        <Button
          onClick={handleDone}
          variant="outline"
          className="w-full h-12 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 bg-transparent"
        >
          Done
        </Button>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
          <Loader2 className="w-10 h-10 text-[#43B02A] animate-spin mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <VerifyPageContent />
    </Suspense>
  )
}
