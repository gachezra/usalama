"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import { getCountyCoordinates, KENYA_CENTER, DEFAULT_ZOOM, type CountyCoordinates } from "@/lib/kenya-counties"
import type { RiskLevel } from "@/lib/types"

interface SingleProjectProps {
  county: string
  title: string
  riskLevel?: RiskLevel
  projects?: never
}

interface MultiProjectProps {
  projects: Array<{
    id: string
    title: string
    county: string
    total_budget: number
    risk_level: RiskLevel
  }>
  county?: never
  title?: never
  riskLevel?: never
}

type ProjectMapProps = SingleProjectProps | MultiProjectProps

// Custom neon marker using DivIcon (avoids PNG loading issues in Next.js)
function createNeonMarker(riskLevel: RiskLevel = "LOW"): L.DivIcon {
  const colorClass = {
    LOW: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
    MEDIUM: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
    HIGH: "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]",
    CRITICAL: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]",
  }[riskLevel]

  return L.divIcon({
    className: "custom-marker",
    html: `<div class="w-4 h-4 rounded-full ${colorClass} border-2 border-white animate-pulse"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

// Component to recenter map when county changes
function MapRecenter({ center }: { center: CountyCoordinates }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, 10)
  }, [center, map])

  return null
}

export default function ProjectMap(props: ProjectMapProps) {
  const isMulti = "projects" in props && Array.isArray(props.projects)

  const center: CountyCoordinates = isMulti
    ? KENYA_CENTER
    : getCountyCoordinates(props.county!)
  const zoom = isMulti ? DEFAULT_ZOOM : 10

  return (
    <div className="relative h-full min-h-[300px] rounded-lg overflow-hidden border border-slate-700/50">
      {/* Dark mode overlay filter */}
      <style jsx global>{`
        .leaflet-container {
          filter: grayscale(100%) invert(100%) contrast(125%);
          background: #1e293b;
        }
        .leaflet-control-attribution {
          display: none;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(71, 85, 105, 0.5) !important;
          border-radius: 8px !important;
          backdrop-filter: blur(8px);
        }
        .leaflet-popup-content {
          color: #e2e8f0 !important;
          margin: 8px 12px !important;
        }
        .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95) !important;
        }
      `}</style>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={center} />

        {isMulti ? (
          props.projects!.map((project) => {
            const coords = getCountyCoordinates(project.county)
            return (
              <Marker
                key={project.id}
                position={coords}
                icon={createNeonMarker(project.risk_level || "LOW")}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold text-cyan-400">{project.title}</p>
                    <p className="text-slate-400 text-xs mt-1">{project.county} County</p>
                    <p className="text-slate-300 text-xs mt-1 font-mono">
                      KES {project.total_budget?.toLocaleString("en-KE")}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )
          })
        ) : (
          <Marker position={center} icon={createNeonMarker(props.riskLevel || "LOW")}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-cyan-400">{props.title}</p>
                <p className="text-slate-400 text-xs mt-1">{props.county} County</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Location label overlay */}
      {!isMulti && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-md border border-slate-700/50">
          <p className="text-xs text-slate-300 font-medium">{props.county} County</p>
          <p className="text-[10px] text-slate-500 font-mono">
            {center[0].toFixed(4)}, {center[1].toFixed(4)}
          </p>
        </div>
      )}
    </div>
  )
}
