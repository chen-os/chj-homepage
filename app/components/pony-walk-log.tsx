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
  source?: "gps" | "manual";
};

const STORAGE_KEY = "pony-walk-logs-v1";
const WEIGHT_KG = 91;
const CALORIE_FACTOR = 0.75;
const TOKYO_CENTER: LatLngExpression = [35.6812, 139.7671];

function formatDurationJa(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}時間${m}分`;
  return `${m}分`;
}

function formatDateJa(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function localDateKey(value: string | number | Date): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayInputValue(): string {
  return localDateKey(new Date());
}

function calcAvgSpeedKmh(distanceKm: number, durationSec: number): number {
  if (durationSec <= 0) return 0;
  return distanceKm / (durationSec / 3600);
}

function calcCalories(distanceKm: number): number {
  return distanceKm * WEIGHT_KG * CALORIE_FACTOR;
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
  const [walkMemo, setWalkMemo] = useState("");
  const [error, setError] = useState("");
  const [currentLocation, setCurrentLocation] = useState<RoutePoint | null>(null);

  const [formDate, setFormDate] = useState(todayInputValue);
  const [formDistance, setFormDistance] = useState("");
  const [formMinutes, setFormMinutes] = useState("");
  const [formMemo, setFormMemo] = useState("");

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
    if (!("geolocation" in navigator)) {
      setError("散歩を記録するには位置情報の許可が必要です。");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
        });
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError("散歩を記録するには位置情報の許可が必要です。");
          return;
        }
        setError("現在地を取得できませんでした。");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  }, []);

  useEffect(() => {
    async function updateCurrentLocationOnMap() {
      const map = mapRef.current;
      if (!map || !currentLocation) return;
      const L = await import("leaflet");
      const latLng: LatLngExpression = [currentLocation.lat, currentLocation.lng];

      if (!markerRef.current) {
        markerRef.current = L.circleMarker(latLng, {
          radius: 6,
          color: "#171717",
          fillColor: "#171717",
          fillOpacity: 1,
          weight: 1,
        }).addTo(map);
      } else {
        markerRef.current.setLatLng(latLng);
      }

      map.setView(latLng, Math.max(map.getZoom(), 16));
    }

    void updateCurrentLocationOnMap();
  }, [currentLocation]);

  useEffect(() => {
    async function updateMap() {
      const map = mapRef.current;
      if (!map) return;
      const L = await import("leaflet");
      const points = route.map((point) => [point.lat, point.lng] as LatLngExpression);

      if (points.length === 0) {
        lineRef.current?.setLatLngs([]);
        return;
      }

      if (!lineRef.current) {
        lineRef.current = L.polyline(points, {
          color: "#171717",
          weight: 3,
          opacity: 0.85,
        }).addTo(map);
      } else {
        lineRef.current.setLatLngs(points);
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
    const avgSpeed = calcAvgSpeedKmh(distanceKm, durationSec);

    return {
      distanceKm,
      durationSec,
      avgSpeed,
      calories: calcCalories(distanceKm),
    };
  }, [currentDistanceKm, elapsedSec, isWalking, logs]);

  const recentLogs = useMemo(
    () =>
      [...logs].sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      ),
    [logs],
  );

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
      setError("この端末では位置情報を利用できません。");
      return;
    }

    setRoute([]);
    setPee(false);
    setPoop(false);
    setWalkMemo("");
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
        setCurrentLocation(nextPoint);
        setRoute((prev) => [...prev, nextPoint]);
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError("散歩を記録するには位置情報の許可が必要です。");
          return;
        }
        setError("GPS の追跡に失敗しました。");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
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
      memo: walkMemo.trim(),
      source: "gps",
    };

    setLogs((prev) => [...prev, nextLog]);
    setIsWalking(false);
    setStartedAt(null);
    setElapsedSec(durationSec);
  }, [clearTimer, clearWatch, isWalking, pee, poop, route, startedAt, walkMemo]);

  const submitManualLog = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const distanceKm = Number(formDistance);
    const minutes = Number(formMinutes);

    if (!formDate) {
      setError("日付を入力してください。");
      return;
    }
    if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
      setError("距離を正しく入力してください。");
      return;
    }
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setError("時間を正しく入力してください。");
      return;
    }

    const durationSec = Math.round(minutes * 60);
    const startedAtIso = new Date(`${formDate}T12:00:00`).toISOString();
    const endedAtIso = new Date(
      new Date(`${formDate}T12:00:00`).getTime() + durationSec * 1000,
    ).toISOString();

    const nextLog: WalkLog = {
      id: String(Date.now()),
      startedAt: startedAtIso,
      endedAt: endedAtIso,
      durationSec,
      distanceKm,
      route: [],
      pee: false,
      poop: false,
      memo: formMemo.trim(),
      source: "manual",
    };

    setLogs((prev) => [...prev, nextLog]);
    setFormDistance("");
    setFormMinutes("");
    setFormMemo("");
  };

  return (
    <main className="mx-auto min-h-[100dvh] max-w-md bg-white px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] sm:max-w-lg">
      <header className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium tracking-[0.24em] text-neutral-400">
            PONY.CHJ.JP
          </p>
          <h1 className="mt-2 text-3xl font-light tracking-tight text-neutral-900">
            Pony Life Dashboard
          </h1>
        </div>
        <p className="text-right text-[10px] leading-relaxed text-neutral-400">
          体重
          <br />
          {WEIGHT_KG} kg
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
        <div ref={mapElRef} className="h-[240px] w-full" />
      </section>

      {error ? (
        <p className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-[11px] leading-relaxed text-neutral-600">
          {error}
        </p>
      ) : null}

      <section className="mt-4 grid grid-cols-2 gap-2">
        <Metric
          label="今日の散歩距離"
          value={`${todayStats.distanceKm.toFixed(2)} km`}
        />
        <Metric
          label="今日の散歩時間"
          value={formatDurationJa(todayStats.durationSec)}
        />
        <Metric
          label="平均速度"
          value={`${todayStats.avgSpeed.toFixed(1)} km/h`}
        />
        <Metric
          label="消費カロリー"
          value={`${Math.round(todayStats.calories)} kcal`}
        />
      </section>

      <section className="mt-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4">
        <p className="text-[10px] tracking-wide text-neutral-400">GPS 散歩記録</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={startWalk}
            disabled={isWalking}
            className="flex-1 rounded-xl border border-neutral-900 bg-neutral-900 py-3 text-[12px] font-medium tracking-wide text-white disabled:opacity-35"
          >
            散歩開始
          </button>
          <button
            type="button"
            onClick={endWalk}
            disabled={!isWalking}
            className="flex-1 rounded-xl border border-neutral-200 py-3 text-[12px] font-medium tracking-wide text-neutral-700 disabled:opacity-35"
          >
            散歩終了
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-neutral-100 px-3 py-2 text-[12px] text-neutral-700">
            <input
              type="checkbox"
              checked={pee}
              onChange={(event) => setPee(event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            おしっこ
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-neutral-100 px-3 py-2 text-[12px] text-neutral-700">
            <input
              type="checkbox"
              checked={poop}
              onChange={(event) => setPoop(event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            うんち
          </label>
        </div>

        <label className="mt-3 block">
          <span className="mb-1.5 block text-[10px] tracking-wide text-neutral-400">
            メモ
          </span>
          <textarea
            value={walkMemo}
            onChange={(event) => setWalkMemo(event.target.value)}
            rows={2}
            placeholder="天気、様子、ルート..."
            className="w-full resize-none rounded-xl border border-neutral-100 bg-neutral-50/60 px-3 py-2 text-[12px] leading-relaxed text-neutral-800 outline-none focus:border-neutral-300"
          />
        </label>
      </section>

      <section className="mt-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4">
        <p className="text-[10px] tracking-wide text-neutral-400">散歩記録を追加</p>
        <form className="mt-3 space-y-3" onSubmit={submitManualLog}>
          <label className="block">
            <span className="mb-1.5 block text-[10px] tracking-wide text-neutral-400">
              日付
            </span>
            <input
              type="date"
              value={formDate}
              onChange={(event) => setFormDate(event.target.value)}
              className="w-full rounded-xl border border-neutral-100 bg-neutral-50/60 px-3 py-2 text-[12px] text-neutral-800 outline-none focus:border-neutral-300"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1.5 block text-[10px] tracking-wide text-neutral-400">
                距離（km）
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formDistance}
                onChange={(event) => setFormDistance(event.target.value)}
                placeholder="1.2"
                className="w-full rounded-xl border border-neutral-100 bg-neutral-50/60 px-3 py-2 text-[12px] text-neutral-800 outline-none focus:border-neutral-300"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] tracking-wide text-neutral-400">
                時間（分）
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={formMinutes}
                onChange={(event) => setFormMinutes(event.target.value)}
                placeholder="25"
                className="w-full rounded-xl border border-neutral-100 bg-neutral-50/60 px-3 py-2 text-[12px] text-neutral-800 outline-none focus:border-neutral-300"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[10px] tracking-wide text-neutral-400">
              メモ
            </span>
            <textarea
              value={formMemo}
              onChange={(event) => setFormMemo(event.target.value)}
              rows={2}
              placeholder="公園、雨上がり、元気..."
              className="w-full resize-none rounded-xl border border-neutral-100 bg-neutral-50/60 px-3 py-2 text-[12px] leading-relaxed text-neutral-800 outline-none focus:border-neutral-300"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl border border-neutral-900 bg-neutral-900 py-3 text-[12px] font-medium tracking-wide text-white"
          >
            記録する
          </button>
        </form>
      </section>

      <section className="mt-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4">
        <p className="text-[10px] tracking-wide text-neutral-400">最近の散歩記録</p>
        {recentLogs.length === 0 ? (
          <p className="mt-3 text-[12px] text-neutral-400">まだ記録がありません。</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recentLogs.slice(0, 8).map((log) => {
              const speed = calcAvgSpeedKmh(log.distanceKm, log.durationSec);
              const calories = calcCalories(log.distanceKm);
              return (
                <li
                  key={log.id}
                  className="rounded-xl border border-neutral-100 px-3 py-3 text-[11px] leading-relaxed text-neutral-600"
                >
                  <p className="font-medium text-neutral-900">
                    {formatDateJa(log.startedAt)}
                  </p>
                  <p className="mt-1">
                    {log.distanceKm.toFixed(2)} km · {formatDurationJa(log.durationSec)} ·
                    平均 {speed.toFixed(1)} km/h · {Math.round(calories)} kcal
                  </p>
                  {log.memo ? <p className="mt-1 text-neutral-400">{log.memo}</p> : null}
                </li>
              );
            })}
          </ul>
        )}
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
