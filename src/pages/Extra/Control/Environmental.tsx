import React, { useEffect, useMemo, useState } from "react";
import ToggleManualAutoMode from "./Toggle_Manual_Auto_Mode";
import { FaFan, FaLightbulb, FaFireAlt } from "react-icons/fa";
import { Wind, Thermometer, Droplet } from "lucide-react";
import axios from "axios";

interface EnvironmentalProps {
  batchID: number | undefined;
}

type Telemetry = {
  id: string;
  last_sensors?: Record<string, number>;
  last_hello?: string;
  mode?: string;       // "automatic" | "manual"
  relays?: number[];   // [relay1, relay2, relay3]
};

const Environmental: React.FC<EnvironmentalProps> = () => {
  // server host and device id
  const serverHost =
    ((import.meta as any).env.VITE_APP_SERVERHOST as string)?.replace(/\/+$/, "") || "";
  const ENV_DEVICE_ID = "gw-16ebb";

  // cached device mode and relays for UI
  const [isAutoMode, setIsAutoMode] = useState<boolean>(false);
  const [relays, setRelays] = useState<{ heater: number; light: number; fan: number }>({
    heater: 0,
    light: 0,
    fan: 0,
  });

  // sensors
  const [sensors, setSensors] = useState<{
    tempC?: number;
    humidity?: number;
    lux?: number;
    mq135?: number;
  }>({});

  const [error, setError] = useState<string | null>(null);
  const [lastHello, setLastHello] = useState<Date | null>(null);

  // realtime via SSE
  useEffect(() => {
    if (!serverHost) return;

    let closed = false;
    let es: EventSource | null = null;

    const connect = () => {
      es = new EventSource(`${serverHost}/telemetry/stream?dev=${ENV_DEVICE_ID}`);

      es.onmessage = (ev) => {
        if (closed) return;
        try {
          const data: Telemetry = JSON.parse(ev.data);

          const ls = data.last_sensors || {};
          setSensors({
            tempC: ls.temperature_c,
            humidity: ls.humidity_pct,
            lux: ls.light_lux,
            mq135: ls.mq135_ppm,
          });

          const arr = Array.isArray(data.relays)
            ? data.relays
            : [
                Number((ls as any).relay1 || 0),
                Number((ls as any).relay2 || 0),
                Number((ls as any).relay3 || 0),
              ];
          setRelays({
            heater: arr[0] ? 1 : 0,
            light: arr[1] ? 1 : 0,
            fan: arr[2] ? 1 : 0,
          });

          if (data.mode) setIsAutoMode(data.mode === "automatic");
          if (data.last_hello) {
            const dt = new Date(data.last_hello);
            if (!Number.isNaN(dt.getTime())) setLastHello(dt);
          }
          setError(null);
        } catch {
          // ignore malformed packet
        }
      };

      es.onerror = () => {
        setError((prev) => prev || null);
        es && es.close();
        es = null;
      };
    };

    connect();
    return () => {
      closed = true;
      if (es) es.close();
    };
  }, [serverHost]);

  // polling fallback every 2s
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const { data } = await axios.get<Telemetry>(
          `${serverHost}/telemetry/${ENV_DEVICE_ID}`
        );
        if (stop) return;

        const ls = data.last_sensors || {};
        setSensors({
          tempC: ls.temperature_c,
          humidity: ls.humidity_pct,
          lux: ls.light_lux,
          mq135: ls.mq135_ppm,
        });

        const arr = Array.isArray(data.relays)
          ? data.relays
          : [
              Number((ls as any).relay1 || 0),
              Number((ls as any).relay2 || 0),
              Number((ls as any).relay3 || 0),
            ];
        setRelays({
          heater: arr[0] ? 1 : 0,
          light: arr[1] ? 1 : 0,
          fan: arr[2] ? 1 : 0,
        });

        if (data.mode) setIsAutoMode(data.mode === "automatic");
        if (data.last_hello) {
          const dt = new Date(data.last_hello);
          if (!Number.isNaN(dt.getTime())) setLastHello(dt);
        }
        setError(null);
      } catch {
        // ok if SSE is active
      } finally {
        if (!stop) setTimeout(tick, 2000);
      }
    };
    tick();
    return () => {
      stop = true;
    };
  }, [serverHost]);

  // toggle Auto or Manual and send to device via backend passthrough
  const handleToggleMode = async (isAuto: boolean) => {
    setIsAutoMode(isAuto);
    try {
      await axios.post(
        `${serverHost}/mode/${ENV_DEVICE_ID}`,
        { mode: isAuto ? "automatic" : "manual" },
        { headers: { "Content-Type": "application/json" } }
      );
    } catch {
      setIsAutoMode((prev) => !prev);
      console.warn("Mode update failed");
    }
  };

  // helper to build payload for single relay toggle
  const buildRelayPayload = (key: "heater" | "light" | "fan", value: 0 | 1) => {
    const payload: Record<string, any> = { mode: "manual" };
    if (key === "heater") payload.relay1 = value;
    if (key === "light")  payload.relay2 = value;
    if (key === "fan")    payload.relay3 = value;
    return payload;
  };

  const toggleRelay = async (key: "heater" | "light" | "fan") => {
    if (isAutoMode) return;
    const next = relays[key] ? 0 : 1;
    setRelays((r) => ({ ...r, [key]: next }));

    try {
      await axios.post(
        `${serverHost}/set-relays/${ENV_DEVICE_ID}`,
        buildRelayPayload(key, next),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch {
      setRelays((r) => ({ ...r, [key]: r[key] ? 0 : 1 }));
      console.warn(`Failed to toggle ${key}`);
    }
  };

  const isHeaterOn = !!relays.heater;
  const isLightOn  = !!relays.light;
  const isFanOn    = !!relays.fan;

  const lastSeenText = useMemo(() => {
    if (!lastHello) return "N/A";
    const diffMs = Date.now() - lastHello.getTime();
    if (diffMs < 5000) return "just now";
    const secs = Math.floor(diffMs / 1000);
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  }, [lastHello]);

  return (
    <div className="relative p-4">
      <ToggleManualAutoMode
        isAuto={isAutoMode}
        onToggle={handleToggleMode}
        className="fixed top-4 right-4 z-50"
      />

      {/* Readings box 
      <div className="mb-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">
              Context • Source <span className="font-semibold text-green-700">Go server</span> • Device <span className="font-semibold text-green-700">{ENV_DEVICE_ID}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`inline-block h-2 w-2 rounded-full ${error ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`}
                aria-hidden
              />
              <span className={error ? "text-red-600" : "text-gray-500"}>
                {error ? `Telemetry error: ${error}` : `Live • Last seen ${lastSeenText}`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-md bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Temperature</div>
              <div className="text-lg font-semibold">
                {sensors.tempC?.toFixed(1) ?? "N/A"}°C
              </div>
            </div>
            <div className="rounded-md bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Humidity</div>
              <div className="text-lg font-semibold">
                {sensors.humidity?.toFixed(0) ?? "N/A"}%
              </div>
            </div>
            <div className="rounded-md bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Lux</div>
              <div className="text-lg font-semibold">
                {sensors.lux?.toFixed(0) ?? "N/A"}
              </div>
            </div>
            <div className="rounded-md bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Air MQ135</div>
              <div className="text-lg font-semibold">
                {sensors.mq135?.toFixed(0) ?? "N/A"} ppm
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Mode <b className="text-gray-700">{isAutoMode ? "Automatic" : "Manual"}</b>
          </div>
        </div>
      </div>*/}

      {/* Three cards using your design */}
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Air Quality */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center gap-2 mb-3 h-8">
              <Wind className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="font-semibold text-green-700 text-lg whitespace-nowrap">
                Air Quality
              </span>
            </div>
            <div className="flex-1 p-4 bg-white border-2 border-green-200 shadow-sm rounded-xl">
              <div className="h-32 bg-green-50 rounded flex items-center justify-center text-green-600">
                {sensors.mq135 != null ? `${sensors.mq135.toFixed(0)} ppm` : "No data"}
              </div>
            </div>
          </div>

          {/* Temperature */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center gap-2 mb-3 h-8">
              <Thermometer className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="font-semibold text-green-700 text-lg whitespace-nowrap">
                Temperature
              </span>
            </div>
            <div className="flex-1 p-4 bg-white border-2 border-green-200 shadow-sm rounded-xl">
              <div className="h-32 bg-green-50 rounded flex items-center justify-center text-green-600">
                {sensors.tempC != null ? `${sensors.tempC.toFixed(1)} °C` : "No data"}
              </div>
            </div>
          </div>

          {/* Current Humidity */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center gap-2 mb-3 h-8">
              <Droplet className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="font-semibold text-green-700 text-lg whitespace-nowrap">
                Current Humidity
              </span>
            </div>
            <div className="flex-1 p-4 bg-white border-2 border-green-200 shadow-sm rounded-xl">
              <div className="h-32 bg-green-50 rounded flex items-center justify-center text-green-600">
                {sensors.humidity != null ? `${sensors.humidity.toFixed(0)} %` : "No data"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control buttons */}
      <div className={`flex flex-wrap justify-center gap-6 my-6 ${isAutoMode ? "opacity-50" : ""}`}>
        {/* Heater */}
        <button
          onClick={() => toggleRelay("heater")}
          disabled={isAutoMode}
          className={`flex flex-col items-center p-4 rounded-lg transition-colors ${
            isHeaterOn ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
          } ${isAutoMode ? "cursor-not-allowed" : "hover:bg-green-50"}`}
        >
          <FaFireAlt className={`text-3xl mb-2 ${isHeaterOn ? "text-orange-500" : "text-gray-500"}`} />
          <span className="font-medium">Heater</span>
          <span className="text-sm">{isHeaterOn ? "ON" : "OFF"}</span>
        </button>

        {/* Light */}
        <button
          onClick={() => toggleRelay("light")}
          disabled={isAutoMode}
          className={`flex flex-col items-center p-4 rounded-lg transition-colors ${
            isLightOn ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
          } ${isAutoMode ? "cursor-not-allowed" : "hover:bg-green-50"}`}
        >
          <FaLightbulb className={`text-3xl mb-2 ${isLightOn ? "text-yellow-400" : "text-gray-500"}`} />
          <span className="font-medium">Light</span>
          <span className="text-sm">{isLightOn ? "ON" : "OFF"}</span>
        </button>

        {/* Fan */}
        <button
          onClick={() => toggleRelay("fan")}
          disabled={isAutoMode}
          className={`flex flex-col items-center p-4 rounded-lg transition-colors ${
            isFanOn ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
          } ${isAutoMode ? "cursor-not-allowed" : "hover:bg-green-50"}`}
        >
          <FaFan className={`text-3xl mb-2 ${isFanOn ? "text-green-600 animate-spin" : "text-gray-500"}`} />
          <span className="font-medium">Fans</span>
          <span className="text-sm">{isFanOn ? "ON" : "OFF"}</span>
        </button>
      </div>
    </div>
  );
};

export default Environmental;
