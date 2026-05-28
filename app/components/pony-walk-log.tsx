"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CircleMarker, LatLngExpression, Map as LeafletMap, Polyline } from "leaflet";

type RoutePoint = {
  lat: number;
  lng: number;
  timestamp: number;
};

type WalkLog = {
  id: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  distanceKm: number;
  route: RoutePoint[];
  pee: boolean;
  poop: boolean;
  memo: string;
};

const STORAGE_KEY = "pony-walk-logs-v1";
const WEIGHT_KG = 91;
const TOKYO_CENTER: LatLngExpression = [35.6812, 139.7671];

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

function formatTime(value: string | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function localDateKey(value: string | number | Date): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function distanceBetween(a: RoutePoint, b: RoutePoint): number {
  const radiusKm = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radiusKm * Math.asin(Math.sqrt(h));
}

function routeDistanceKm(route: RoutePoint[]): number {
  return route.reduce((total, point, index) => {
    if (index === 0) return total;
    return total + distanceBetween(route[index - 1], point);
  }, 0);
}

function loadLogs(): WalkLog[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WalkLog[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function PonyWalkLog() {
  const [logs, setLogs] = useState<WalkLog[]>([]);
  const [isWalking, setIsWalking] = useState(false);
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [pee, setPee] = useState(false);
  const [poop, setPoop] = useState(false);
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");

  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const lineRef = useRef<Polyline | null>(null);
  const markerRef = useRef<CircleMarker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setLogs(loadLogs());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapElRef.current || mapRef.current) return;
      const L = await import("leaflet");
      if (cancelled || !mapElRef.current) return;

      const map = L.map(mapElRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView(TOKYO_CENTER, 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapRef.current = map;
    }

    void initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    async function updateMap() {
      const map = mapRef.current;
      if (!map) return;
      const L = await import("leaflet");
      const points = route.map((point) => [point.lat, point.lng] as LatLngExpression);

      if (!lineRef.current) {
        lineRef.current = L.polyline(points, {
          color: "#171717",
          weight: 3,
          opacity: 0.85,
        }).addTo(map);
      } else {
        lineRef.current.setLatLngs(points);
      }

      const last = route.at(-1);
      if (!last) return;

      const lastLatLng: LatLngExpression = [last.lat, last.lng];
      if (!markerRef.current) {
        markerRef.current = L.circleMarker(lastLatLng, {
          radius: 6,
          color: "#171717",
          fillColor: "#171717",
          fillOpacity: 1,
          weight: 1,
        }).addTo(map);
      } else {
        markerRef.current.setLatLng(lastLatLng);
      }

      if (route.length === 1) {
        map.setView(lastLatLng, 16);
      } else {
        map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 17 });
      }
    }

    void updateMap();
  }, [route]);

  const currentDistanceKm = useMemo(() => routeDistanceKm(route), [route]);

  const todayStats = useMemo(() => {
    const today = localDateKey(new Date());
    const todayLogs = logs.filter((log) => localDateKey(log.startedAt) === today);
    const completedDistance = todayLogs.reduce((sum, log) => sum + log.distanceKm, 0);
    const completedDuration = todayLogs.reduce((sum, log) => sum + log.durationSec, 0);
    const distanceKm = completedDistance + (isWalking ? currentDistanceKm : 0);
    const durationSec = completedDuration + (isWalking ? elapsedSec : 0);
    const avgSpeed = durationSec > 0 ? distanceKm / (durationSec / 3600) : 0;
    const lastWalk = todayLogs.at(-1);

    return {
      distanceKm,
      durationSec,
      avgSpeed,
      calories: WEIGHT_KG * distanceKm * 0.8,
      walkCount: todayLogs.length + (isWalking ? 1 : 0),
      lastWalkTime: lastWalk ? formatTime(lastWalk.endedAt) : "—",
    };
  }, [currentDistanceKm, elapsedSec, isWalking, logs]);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      window.navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearWatch();
      clearTimer();
    };
  }, [clearTimer, clearWatch]);

  const startWalk = useCallback(() => {
    setError("");

    if (!("geolocation" in navigator)) {
      setError("GPS is not available on this device.");
      return;
    }

    setRoute([]);
    setPee(false);
    setPoop(false);
    setMemo("");
    setElapsedSec(0);
    setIsWalking(true);
    const started = Date.now();
    setStartedAt(started);

    timerRef.current = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 1000);

    watchIdRef.current = window.navigator.geolocation.watchPosition(
      (position) => {
        const nextPoint: RoutePoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
        };
        setRoute((prev) => [...prev, nextPoint]);
      },
      (geoError) => {
        setError(geoError.message || "Unable to track GPS.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      },
    );
  }, []);

  const endWalk = useCallback(() => {
    if (!isWalking || !startedAt) return;

    clearWatch();
    clearTimer();

    const endedAt = Date.now();
    const durationSec = Math.max(0, Math.floor((endedAt - startedAt) / 1000));
    const distanceKm = routeDistanceKm(route);

    const nextLog: WalkLog = {
      id: String(endedAt),
      startedAt: new Date(startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      durationSec,
      distanceKm,
      route,
      pee,
      poop,
      memo: memo.trim(),
    };

    setLogs((prev) => [...prev, nextLog]);
    setIsWalking(false);
    setStartedAt(null);
    setElapsedSec(durationSec);
  }, [clearTimer, clearWatch, isWalking, memo, pee, poop, route, startedAt]);

  return (
    <main className="mx-auto min-h-[100dvh] max-w-md bg-white px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] sm:max-w-lg">
      <header className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium tracking-[0.24em] text-neutral-400">
            PONY.CHJ.JP
          </p>
          <h1 className="mt-2 text-3xl font-light tracking-tight text-neutral-900">
            Pony Walk Log
          </h1>
        </div>
        <p className="text-right text-[10px] leading-relaxed text-neutral-400">
          Weight
          <br />
          {WEIGHT_KG} kg
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
        <div ref={mapElRef} className="h-[280px] w-full" />
      </section>

      {error ? (
        <p className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-[11px] leading-relaxed text-neutral-600">
          {error}
        </p>
      ) : null}

      <section className="mt-4 grid grid-cols-2 gap-2">
        <Metric label="Today distance" value={`${todayStats.distanceKm.toFixed(2)} km`} />
        <Metric label="Today duration" value={formatDuration(todayStats.durationSec)} />
        <Metric label="Average speed" value={`${todayStats.avgSpeed.toFixed(1)} km/h`} />
        <Metric label="Calories" value={`${Math.round(todayStats.calories)} kcal`} />
        <Metric label="Walk count" value={String(todayStats.walkCount)} />
        <Metric label="Last walk" value={todayStats.lastWalkTime} />
      </section>

      <section className="mt-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={startWalk}
            disabled={isWalking}
            className="flex-1 rounded-xl border border-neutral-900 bg-neutral-900 py-3 text-[12px] font-medium tracking-wide text-white disabled:opacity-35"
          >
            Start Walk
          </button>
          <button
            type="button"
            onClick={endWalk}
            disabled={!isWalking}
            className="flex-1 rounded-xl border border-neutral-200 py-3 text-[12px] font-medium tracking-wide text-neutral-700 disabled:opacity-35"
          >
            End Walk
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-neutral-100 px-3 py-2 text-[12px] text-neutral-700">
            <input
              type="checkbox"
              checked={pee}
              onChange={(event) => setPee(event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            Pee
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-neutral-100 px-3 py-2 text-[12px] text-neutral-700">
            <input
              type="checkbox"
              checked={poop}
              onChange={(event) => setPoop(event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            Poop
          </label>
        </div>

        <label className="mt-3 block">
          <span className="mb-1.5 block text-[10px] tracking-wide text-neutral-400">
            Memo
          </span>
          <textarea
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            rows={3}
            placeholder="Mood, weather, route..."
            className="w-full resize-none rounded-xl border border-neutral-100 bg-neutral-50/60 px-3 py-2 text-[12px] leading-relaxed text-neutral-800 outline-none focus:border-neutral-300"
          />
        </label>
      </section>

      <footer className="mt-8 text-center text-[10px] tracking-wide text-neutral-300">
        CHJ © 2026
      </footer>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
      <p className="text-[10px] leading-relaxed text-neutral-400">{label}</p>
      <p className="mt-1 text-lg font-light tracking-tight text-neutral-900">
        {value}
      </p>
    </div>
  );
}
