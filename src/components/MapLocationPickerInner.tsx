"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER } from "@/lib/maps-link";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type Props = {
  lat: number;
  lng: number;
  onMove: (lat: number, lng: number) => void;
};

export function MapLocationPickerInner({ lat, lng, onMove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onMoveRef = useRef(onMove);

  onMoveRef.current = onMove;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat || DEFAULT_MAP_CENTER.lat, lng || DEFAULT_MAP_CENTER.lng],
      zoom: lat && lng ? 16 : 12,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([lat || DEFAULT_MAP_CENTER.lat, lng || DEFAULT_MAP_CENTER.lng], {
      icon: markerIcon,
      draggable: true,
    }).addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onMoveRef.current(pos.lat, pos.lng);
    });

    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      onMoveRef.current(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init map once
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    marker.setLatLng([lat, lng]);
    map.panTo([lat, lng]);
  }, [lat, lng]);

  return <div ref={containerRef} className="h-full min-h-[280px] w-full rounded-lg" />;
}
