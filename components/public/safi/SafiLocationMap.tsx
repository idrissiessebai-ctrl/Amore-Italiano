"use client";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";

const SAFI_COORDINATES: [number, number] = [32.29309068599349, -9.234853959756705];

function MapSizeController() {
  const map = useMap();

  useEffect(() => {
    const invalidate = () => map.invalidateSize({ pan: false });
    const frame = window.requestAnimationFrame(invalidate);
    const timeout = window.setTimeout(invalidate, 150);
    const container = map.getContainer();
    const observer = new ResizeObserver(invalidate);

    observer.observe(container);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      observer.disconnect();
    };
  }, [map]);

  return null;
}

export default function SafiLocationMap() {
  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "amore-map-marker",
        html: '<span class="amore-map-marker__pulse"></span><span class="amore-map-marker__pin"><span>A</span></span>',
        iconSize: [48, 58],
        iconAnchor: [24, 58],
        popupAnchor: [0, -54],
      }),
    [],
  );

  return (
    <MapContainer
      center={SAFI_COORDINATES}
      zoom={15}
      scrollWheelZoom={false}
      zoomControl={false}
      dragging
      className="h-full min-h-[360px] w-full"
      aria-label="Carte indiquant Amore Italiano à Safi"
    >
      <MapSizeController />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      <Marker position={SAFI_COORDINATES} icon={markerIcon}>
        <Popup>
          <strong>Amore Italiano Safi</strong>
          <br />
          Label Gallery · Centre-ville
        </Popup>
      </Marker>
    </MapContainer>
  );
}
