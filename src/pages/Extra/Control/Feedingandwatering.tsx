import React, { useEffect, useMemo, useState } from "react";
import { Droplets, Pill, Utensils } from "lucide-react";
import axios from "axios";
import ToggleManualAutoMode from "./Toggle_Manual_Auto_Mode";
import Feeding from "./Monitoring_FeedingWatering/Feeding";

interface FeedingandwateringProps {
  batchID: number | undefined;
}

/* ------------------------ helpers for monitoring ------------------------ */

type Telemetry = {
  id: string;
  last_sensors?: Record<string, number>;
  last_hello?: string;
  mode?: string;
  relays?: number[];
};

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

function computePercent(distanceCm: number | undefined, maxDepthCm: number): number | null {
  if (distanceCm === undefined || Number.isNaN(distanceCm) || distanceCm < 0) return null;
  const pct = 100 * (1 - distanceCm / maxDepthCm);
  return clamp(Math.round(pct));
}

const LevelGauge: React.FC<{
  label: string;
  percent: number | null;
  distanceCm?: number;
  maxDepthCm: number;
}> = ({ label, percent, distanceCm, maxDepthCm }) => {
  const p = percent ?? 0;
  return (
    <div className="p-3 bg-white border-2 border-pink-200 rounded-xl shadow-sm flex flex-col">
      <div className="text-sm font-semibold text-green-700 mb-2 text-center">{label}</div>

      <div className="flex items-end gap-3">
        <div className="relative w-16 h-36 border-2 border-green-400 rounded-md overflow-hidden bg-gray-50">
          <div
            className="absolute bottom-0 left-0 right-0 bg-green-300 transition-all duration-700 ease-out"
            style={{ height: `${p}%` }}
            aria-label={`${label} level`}
          />
          <div className="absolute inset-0 pointer-events-none">
            {[0, 25, 50, 75, 100].map((t) => (
              <div
                key={t}
                className="absolute left-0 right-0 border-t border-green-200"
                style={{ bottom: `${t}%` }}
              />
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="text-2xl font-bold text-green-700 leading-tight">
            {percent == null ? "N/A" : `${p}%`}
          </div>
          <div className="text-xs text-gray-600">
            {distanceCm == null || Number.isNaN(distanceCm)
              ? "No distance"
              : `${distanceCm.toFixed(1)} cm gap`}
          </div>
          <div className="text-[10px] text-gray-400">Max depth {maxDepthCm} cm</div>
        </div>
      </div>
    </div>
  );
};

const MonitoringPanel: React.FC<{
  serverHost: string;
  deviceId: string;
  maxDepthCm?: [number, number];
  labels?: [string, string];
  pollMs?: number;
}> = ({
  serverHost,
  deviceId,
  maxDepthCm = [40, 40],
  labels = ["Water", "Medicine"],
  pollMs = 2000,
}) => {
  const [data, setData] = useState<Telemetry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetcher = useMemo(
    () => async () => {
      const { data } = await axios.get<Telemetry>(`${serverHost}/telemetry/${deviceId}`);
      return data;
    },
    [serverHost, deviceId]
  );

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const d = await fetcher();
        if (!stop) {
          setData(d);
          setError(null);
        }
      } catch (e: any) {
        if (!stop) setError(e?.message || "Fetch failed");
      } finally {
        if (!stop) window.setTimeout(tick, pollMs);
      }
    };
    tick();
    return () => {
      stop = true;
    };
  }, [fetcher, pollMs]);

  const s1 = data?.last_sensors?.sensor1;
  const s2 = data?.last_sensors?.sensor2;
  const s3 = data?.last_sensors?.sensor3;

  const p1 = computePercent(s1, maxDepthCm[0]);
  const p2 = computePercent(s2, maxDepthCm[1]);


  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Device <span className="font-semibold text-green-700">{deviceId}</span>
          {data?.mode ? (
            <span className="ml-2 px-2 py-[2px] rounded bg-green-50 text-green-700 border border-green-200">
              {data.mode}
            </span>
          ) : null}
        </div>
        <div className="text-xs text-gray-500">
          {error ? <span className="text-red-600">Fetch error: {error}</span> : "Live"}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <LevelGauge label={labels[0]} percent={p1} distanceCm={s1} maxDepthCm={maxDepthCm[0]} />
        <LevelGauge label={labels[1]} percent={p2} distanceCm={s2} maxDepthCm={maxDepthCm[1]} />
      </div>
    </div>
  );
};

/* ------------------------------ main screen ----------------------------- */

const Feedingandwatering: React.FC<FeedingandwateringProps> = ({ batchID }) => {
  const [relayState, setRelayState] = useState({ relay1: 0, relay2: 0, relay3: 0 });
  const [medRelayState, setMedRelayState] = useState({ relay_med1: 0, relay_med2: 0, relay_med3: 0 });
  const [isAutoMode, setIsAutoMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("Control");

  const serverHost = (import.meta.env.VITE_APP_SERVERHOST as string)?.replace(/\/+$/, "") || "";

  // Device IDs
  const FEEDER_DEVICE_ID = "esp-A97A47";
  const WATER_DEVICE_ID = "esp-8A3850";
  const MED_DEVICE_ID   = "esp-11F549";
  const ENV_DEVICE_ID = "gw-16ebb";
  const LEVEL_DEVICE_ID = "gw-6b3e32"; // never touched by the global mode toggle

  // Only devices that should receive mode changes
  const TARGET_DEVICE_IDS = [FEEDER_DEVICE_ID, WATER_DEVICE_ID, MED_DEVICE_ID];

  // Helper to set mode on one device and return success boolean
  const setDeviceMode = async (deviceId: string, isAuto: boolean): Promise<boolean> => {
    try {
      await axios.post(
        `${serverHost}/mode/${deviceId}`,
        { mode: isAuto ? "automatic" : "manual" },
        { headers: { "Content-Type": "application/json" } }
      );
      return true;
    } catch {
      console.warn(`mode set failed for ${deviceId}`);
      return false;
    }
  };

  // Global mode toggle for all present control devices, skipping LEVEL_DEVICE_ID
  const handleToggleMode = async (isAuto: boolean) => {
    // Optimistic UI
    const prev = isAutoMode;
    setIsAutoMode(isAuto);

    // Try all targets in parallel, treat non responsive devices as not present
    const results = await Promise.allSettled(
      TARGET_DEVICE_IDS.map((id) => setDeviceMode(id, isAuto))
    );

    const successes = results
      .filter((r) => r.status === "fulfilled" && r.value === true).length;

    if (successes === 0) {
      // Nobody accepted the mode change, revert UI
      setIsAutoMode(prev);
      console.warn("No devices accepted the mode change, reverting UI");
    }
    // If at least one device accepted, keep the UI state as chosen
    // LEVEL_DEVICE_ID is intentionally excluded, so it stays unaffected
  };

  // Feeder rotate via server push
 const handleFeedRotate = async (degrees: 0 | 90 | 180) => {
  if (isAutoMode) return;
  try {
    await axios.post(
      `${serverHost}/push/${FEEDER_DEVICE_ID}`,
      { degrees, pulse_ms: 1000 },
      { headers: { "Content-Type": "application/json" } }
    );
    console.log(`Feed rotation triggered at ${degrees} degrees`);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.warn(
        "Feed rotate request failed",
        err.response?.status,
        err.response?.data
      );
    } else {
      console.warn("Feed rotate request failed", err);
    }
  }
};



  // Watering: toggle using /set-relays/{deviceId}
  const handleWaterToggle = async (relay: number) => {
    if (isAutoMode) return;
    const key = `relay${relay}` as keyof typeof relayState;
    const next = relayState[key] ? 0 : 1;

    try {
      await axios.post(
        `${serverHost}/set-relays/${WATER_DEVICE_ID}`,
        { [key]: next },
        { headers: { "Content-Type": "application/json" } }
      );
      setRelayState((prev) => ({ ...prev, [key]: next }));
      console.log(`Water relay ${relay} -> ${next}`);
    } catch {
      console.warn(`Failed to toggle water relay ${relay}`);
    }
  };

  // Medicine: same as watering but MED_DEVICE_ID
  const handleMedicine = async (relay: number) => {
    if (isAutoMode) return;
    const uiKey = `relay_med${relay}` as keyof typeof medRelayState;
    const next = medRelayState[uiKey] ? 0 : 1;

    try {
      await axios.post(
        `${serverHost}/set-relays/${MED_DEVICE_ID}`,
        { [`relay${relay}`]: next },
        { headers: { "Content-Type": "application/json" } }
      );
      setMedRelayState((prev) => ({ ...prev, [uiKey]: next }));
      console.log(`Medicine relay ${relay} -> ${next}`);
    } catch {
      console.warn(`Failed to toggle medicine relay ${relay}`);
    }
  };

  const tabComponents: Record<string, React.ReactNode> = {
    Control: <Feeding batchID={batchID} />,
    Monitoring: (
      <MonitoringPanel
        serverHost={serverHost}
        deviceId={LEVEL_DEVICE_ID}
        maxDepthCm={[40, 40]}
        labels={["Water", "Medicine"]}                          
      />
    ),
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 relative">
      <ToggleManualAutoMode
        isAuto={isAutoMode}
        onToggle={handleToggleMode}
        className="absolute right-4 top-4"
      />

      {/* Tabs */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex justify-center border-b border-gray-300">
          {["Control", "Monitoring"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? "text-green-700 border-b-2 border-green-500"
                  : "text-gray-500 hover:text-green-600"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6">{tabComponents[activeTab]}</div>
      </div>

      {/* Feeder Controls, Water, Medicine */}
      <div className="flex flex-col items-center gap-6 mt-6">
        {/* Feed */}
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Utensils className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-700 text-lg">Feed</span>
          </div>
          <div className="p-4 bg-white border-2 border-pink-200 shadow-sm rounded-xl">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  className={`py-3 text-sm sm:text-base font-semibold transition border-2 shadow-sm rounded-lg ${
                    isAutoMode
                      ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                      : "bg-white border-pink-200 text-green-700 hover:bg-green-100 active:bg-green-200"
                  }`}
                  disabled={isAutoMode}
                  aria-disabled={isAutoMode}
                  onClick={() => handleFeedRotate(num === 1 ? 0 : num === 2 ? 90 : 180)}
                >
                  {["Cage 1", "Cage 2", "Cage 3"][num - 1]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Water */}
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Droplets className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-700 text-lg">Water</span>
          </div>
          <div className="p-4 bg-white border-2 border-pink-200 shadow-sm rounded-xl">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex flex-col">
                  <div className="mb-2 p-2 bg-gray-0 border border-pink-200 rounded-lg h-16 flex items-center justify-center text-xs text-gray-600 text-center">
                    Water level is in Monitoring tab
                  </div>
                  <button
                    className={`aspect-square w-full flex items-center justify-center text-lg font-semibold transition border-2 rounded-full ${
                      isAutoMode
                        ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                        : (relayState as any)[`relay${num}`]
                          ? "bg-green-200 border-green-500 text-green-900"
                          : "bg-white border-pink-200 text-green-700 hover:bg-green-100 active:bg-green-200"
                    }`}
                    onClick={() => handleWaterToggle(num)}
                    disabled={false}
                    aria-disabled={false}
                  >
                    {num}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Medicine */}
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Pill className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-700 text-lg">Medicine</span>
          </div>
          <div className="p-4 bg-white border-2 border-pink-200 shadow-sm rounded-xl">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex flex-col">
                  <div className="mb-2 p-2 bg-gray-0 border border-pink-200 rounded-lg h-16 flex items-center justify-center text-xs text-gray-600 text-center">
                    Medicine level is in Monitoring tab
                  </div>
                  <button
                    className={`aspect-square w-full flex items-center justify-center text-lg font-semibold transition border-2 rounded-full ${
                      isAutoMode
                        ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                        : (medRelayState as any)[`relay_med${num}`]
                          ? "bg-green-200 border-green-500 text-green-900"
                          : "bg-white border-pink-200 text-green-700 hover:bg-green-100 active:bg-green-200"
                    }`}
                    onClick={() => handleMedicine(num)}
                    disabled={isAutoMode}
                    aria-disabled={isAutoMode}
                  >
                    {num}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>{/* end flex column */}
    </div>
  );
};

export default Feedingandwatering;
