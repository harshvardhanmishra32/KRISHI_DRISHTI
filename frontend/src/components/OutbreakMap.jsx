"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Circle, Popup, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Leaflet default icon bug fix for Webpack/Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function OutbreakMap({ outbreaks = [], center = [26.8467, 80.9462], zoom = 6 }) {
  const getColor = (level) => {
    switch (level?.toLowerCase()) {
      case "high":
        return "#C62828";
      case "medium":
        return "#EF6C00";
      default:
        return "#F59E0B";
    }
  };

  return (
    <div className="w-full h-72 rounded-card overflow-hidden border border-krishi-border shadow-sm z-0 relative">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {outbreaks.map((alert) => {
          const color = getColor(alert.alert_level);
          return (
            <Circle
              key={alert.id}
              center={[alert.centroid_lat, alert.centroid_lon]}
              radius={alert.alert_level === "high" ? 15000 : 10000} // Radius in meters
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.35,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-xs p-1 space-y-1">
                  <div className="font-bold text-slate-900">
                    {alert.disease_name}
                  </div>
                  <div className="text-slate-600">
                    Crop: <span className="font-semibold">{alert.crop_name}</span>
                  </div>
                  <div className="text-slate-600">
                    Location:{" "}
                    <span className="font-semibold">
                      {alert.district}, {alert.state}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    Reports:{" "}
                    <span className="font-semibold">{alert.report_count}</span>
                  </div>
                  <div
                    className="font-bold uppercase text-[10px] mt-1"
                    style={{ color: color }}
                  >
                    Alert Level: {alert.alert_level}
                  </div>
                </div>
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>
    </div>
  );
}
