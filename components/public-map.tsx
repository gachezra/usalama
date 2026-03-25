"use client"

import { useEffect } from "react"
import L from "leaflet"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import { getCountyCoordinates, KENYA_CENTER, DEFAULT_ZOOM, type CountyCoordinates } from "@/lib/kenya-counties"

type ProjectStatus = "Finished" | "In Progress" | "Stalled" | "Tendered"

interface ProjectMapProps {
  projects: Array<{
    id: string
    title: string
    county: string
    total_budget: number
    status: ProjectStatus
  }>
}

// Custom neon marker based on savanna theme
function createStatusMarker(status: ProjectStatus): L.DivIcon {
  const colorClass = {
    "Finished": "bg-forest shadow-[0_0_10px_rgba(41,77,51,0.5)]",
    "In Progress": "bg-terracotta shadow-[0_0_10px_rgba(226,114,91,0.5)]",
    "Tendered": "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
    "Stalled": "bg-maasai shadow-[0_0_10px_rgba(163,40,36,0.5)]",
  }[status]

  return L.divIcon({
    className: "custom-marker",
    html: `<div class="w-4 h-4 rounded-full ${colorClass} border-2 border-white animate-pulse"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

function MapRecenter({ center }: { center: CountyCoordinates }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 10)
  }, [center, map])
  return null
}

export default function PublicMap({ projects }: ProjectMapProps) {
  return (
    <div className="relative h-[400px] lg:h-full min-h-[400px] rounded-xl overflow-hidden border border-border shadow-sm">
      <style jsx global>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          background: rgba(249, 246, 240, 0.95) !important;
          border: 1px solid rgba(226, 114, 91, 0.2) !important;
          border-radius: 8px !important;
        }
        .leaflet-popup-content {
          color: #294D33 !important;
          margin: 8px 12px !important;
        }
        .leaflet-popup-tip {
          background: rgba(249, 246, 240, 0.95) !important;
        }
      `}</style>

      <MapContainer
        center={KENYA_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {projects.map((project) => {
          const coords = getCountyCoordinates(project.county)
          return (
            <Marker
              key={project.id}
              position={coords}
              icon={createStatusMarker(project.status || "Tendered")}
            >
              <Popup>
                <div className="text-sm font-sans tracking-wide">
                  <p className="font-bold text-foreground">{project.title}</p>
                  <p className="text-foreground/70 text-xs mt-1">{project.county} County</p>
                  <p className="text-terracotta font-semibold text-xs mt-1">
                    {project.status.toUpperCase()}
                  </p>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
