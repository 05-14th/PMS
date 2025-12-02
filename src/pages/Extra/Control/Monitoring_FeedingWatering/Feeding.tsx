import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

interface FeedMonitorProps {
  serverHost: string;
  deviceId: string;
  batchID?: number;
}

interface Telemetry {
  id: string;
  last_sensors?: Record<string, number>;
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

function computePercent(distanceCm: number | undefined, maxDepthCm: number) {
  if (distanceCm == null || isNaN(distanceCm) || distanceCm < 0) return null;
  return clamp(Math.round(100 * (1 - distanceCm / maxDepthCm)));
}

const FeedMonitoring: React.FC<FeedMonitorProps> = ({ serverHost, deviceId }) => {
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const { data } = await axios.get(`${serverHost}/telemetry/${deviceId}`);
        if (!stop) {
          setTelemetry(data);
          setError(null);
        }
      } catch (e: any) {
        if (!stop) setError(e?.message || "Failed");
      } finally {
        if (!stop) setTimeout(tick, 2000);
      }
    };
    tick();
    return () => { stop = true; };
  }, [serverHost, deviceId]);

  const s = telemetry?.last_sensors;
  const maxDepth = 200; // cm — adjust to actual tank height
  const percents = [
    computePercent(s?.sensor1, maxDepth),
    computePercent(s?.sensor2, maxDepth),
    computePercent(s?.sensor3, maxDepth),
  ];

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Device: <span className="font-semibold text-green-700">{deviceId}</span>
        </div>
        <div className="text-xs text-gray-500">
          {error ? <span className="text-red-600">Fetch error: {error}</span> : "Live"}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {percents.map((p, i) => (
          <div
            key={i}
            className="p-3 bg-white border-2 border-pink-200 rounded-xl shadow-sm flex flex-col"
          >
            <div className="text-sm font-semibold text-green-700 mb-2 text-center">
              {["Cage 1", "Cage 2", "Cage 3"][i]}
            </div>

            <div className="flex items-end gap-3">
              {/* Tank visual */}
              <div className="relative w-16 h-36 border-2 border-green-400 rounded-md overflow-hidden bg-gray-50">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-green-300 transition-all duration-700 ease-out"
                  style={{ height: `${p ?? 0}%` }}
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

              {/* Numeric info */}
              <div className="flex-1">
                <div className="text-2xl font-bold text-green-700 leading-tight">
                  {p == null ? "N/A" : `${p}%`}
                </div>
                <div className="text-xs text-gray-600">
                  {p == null ? "No distance" : `${s && Object.values(s)[i]?.toFixed(1)} cm gap`}
                </div>
                <div className="text-[10px] text-gray-400">Max depth {maxDepth} cm</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedMonitoring;
