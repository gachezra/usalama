"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Camera, CheckCircle, Loader2, Shield, Smartphone, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type VerificationState = "instructions" | "task" | "analyzing" | "success"

export default function VerifyPage() {
  const [state, setState] = useState<VerificationState>("instructions")
  const [showMpesaNotification, setShowMpesaNotification] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleStartVerification = () => {
    setState("task")
  }

  const handleTakePhoto = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (event) => {
        setCapturedImage(event.target?.result as string)
        setState("analyzing")
        // Simulate analysis
        await new Promise((resolve) => setTimeout(resolve, 2500))
        setState("success")
        setTimeout(() => setShowMpesaNotification(true), 500)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDone = () => {
    setState("instructions")
    setShowMpesaNotification(false)
    setCapturedImage(null)
  }

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
            I Understand, Let's Start
          </Button>
        </div>
      </div>
    )
  }

  if (state === "task") {
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
              <h1 className="text-xl font-bold text-gray-900">Verify: Moi Avenue Road Construction</h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-[#43B02A] rounded-full" />
                <span className="text-sm text-gray-600">Moi Avenue, Nairobi</span>
              </div>
            </div>

            {/* Reference Image */}
            <div className="p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Reference: What it should look like</p>
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src="/completed-paved-road-in-kenya-with-fresh-tarmac.jpg"
                  alt="Reference: Completed Road"
                  className="w-full h-48 object-cover"
                />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <h3 className="font-semibold text-amber-800 mb-2">Photo Instructions:</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Stand at the same spot as the reference image</li>
              <li>• Make sure the road is clearly visible</li>
              <li>• Take the photo during daylight</li>
              <li>• Avoid blurry photos</li>
            </ul>
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
              // Reset value to allow re-capture
              ;(e.target as HTMLInputElement).value = ""
            }}
          />

          {/* Reward Badge */}
          <div className="text-center mb-4">
            <span className="inline-block bg-[#43B02A]/10 text-[#43B02A] font-semibold px-4 py-2 rounded-full text-sm">
              Earn KSH 50 for this verification
            </span>
          </div>
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
              src={capturedImage || "/placeholder.svg"}
              alt="Captured"
              className="w-full h-48 object-cover rounded-xl border border-gray-200"
            />
          </div>
        )}
      </div>
    )
  }

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
          <p className="text-gray-500 text-sm mt-2">Transaction ID: QH82K3NM9P</p>
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
